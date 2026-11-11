# Auditoria de arquitetura, capacidade e segurança

Documento técnico do projeto (disciplina de Intercursos) — site da ONG
Anjos da Proteção Animal. Medidas abaixo foram coletadas em produção
(anjos-da-protecao-animal.vercel.app) em 26/10/2026.

---

## 1. Arquitetura atual

```
Navegador do visitante
 ├── estáticos (HTML/CSS/JS/imagens) ──> Vercel Edge CDN (POP São Paulo)
 └── dados dos animais ──> Google Sheets (CSV de exportação, 8,4 KB)
                             └── fallback: endpoint gviz (JSONP)
Formulário de contato ──> mailto (abre o e-mail; nada trafega por servidor)
WhatsApp/adoção ──> links wa.me (navegação direta)
```

- Site 100% estático: **nenhum servidor de aplicação, banco de dados
  próprio, sessão ou login**.
- A "vitrine" é montada no cliente a partir da planilha (client-side).
- Deploy: `git push` (GitHub) → `vercel deploy --prod` (CLI).
- Única dependência externa de execução: Google Fonts (CSS/woff2).

## 2. Capacidade: requests e usuários simultâneos

### Peso medido por visita (gzip, produção)

| Recurso | Tamanho |
|---|---|
| index.html + CSS + 3 JS | ~19,6 KB |
| logo + favicon + hero SVG | ~9 KB |
| Google Fonts (subsets usados) | ~250 KB |
| CSV da planilha | 8,4 KB |
| **Primeira visita total** | **~280 KB em ~15 requests** |
| Navegação interna (cache quente) | ~10 KB em ~4 requests |

### O que limita e o que não limita

1. **Conteúdo estático (Vercel CDN): não é o gargalo.** Não há
   computação por request e a Vercel não publica limite de conexões
   simultâneas para estáticos. Milhares de acessos simultâneos são
   triviais para uma CDN. O plano Hobby limita **banda (100 GB/mês)**:
   a ~280 KB por primeira visita, o orçamento dá na ordem de
   **~400 mil primeiras visitas/mês** — várias ordens de grandeza
   acima do tráfego real de uma ONG.
2. **Google Sheets: o único ponto sem garantia.** Cada primeira visita
   dispara 1 fetch ao endpoint de exportação do Google. Esse endpoint
   é **não oficial, sem SLA e com limite não documentado**; o Google
   ainda responde com cache curto (minutos), o que faz muitos
   visitantes compartilharem a mesma resposta. Na prática ele tolera
   milhares de acessos por hora a um documento pequeno, mas sob pico
   viral pode aplicar *throttle* (429) — o site exibiria o erro amigável
   da vitrine e o fallback gviz tentaria assumir.

### Resumo prático

| Cenário | Estáticos (CDN) | Google Sheets |
|---|---|---|
| 50 simultâneos (feira de adoção) | trivial | sem risco |
| 500 simultâneos (campanha local) | trivial | sem risco |
| 5.000 simultâneos (viral) | trivial | risco de *throttle* |
| Escala acima disso | trivial | **exige proxy com cache** (ver §3) |

**Conclusão honesta:** não existe um número mágico de "usuários
simultâneos" — para o site estático, dezenas de milhares passam
despercebidas; o teto real é o humor do endpoint do Google. Se um dia
o tráfego justificar, o proxy com cache do §3 remove esse teto
(cache de 5 min = no máximo ~12 fetches/hora ao Google, não importa
o número de visitantes).

## 3. Segurança — estado atual e melhorias

### 3.1 O que já está bom

- **Nenhum dado pessoal de usuário é coletado ou trafega por
  servidor**: sem contas, sem cookies próprios, sem localStorage de
  PII; formulário usa `mailto` (o texto abre no e-mail do próprio
  usuário, nada é gravado).
- HTTPS em tudo (Vercel + Google), HSTS ativo.
- Sem dependências JavaScript de terceiros em execução (zero libs) —
  superfície de ataque pequena; sem `eval`, sem inline scripts.
- `.vercel/project.json` e arquivos de configuração do deploy não são
  servidos (404 verificado).
- O site exibe apenas os campos não sensíveis dos animais
  (nome, espécie, sexo, idade, cor, comportamento, castração,
  vacinação, medicação contínua).

### 3.2 Achados e melhorias

**A1 (principal): a planilha inteira é pública para quem tem a URL —
e a URL está no código público.** O site filtra o que exibe, mas
qualquer pessoa que abrir o DevTools (ou ler o repositório) obtém a
URL do CSV e baixa as **23 colunas completas**: microchip, doença
crônica (FIV, leishmaniose), medicação, procedência (empresas), datas
de entrada. Mitigações, em ordem de custo:

- *Conversa com a ONG (gratuito):* pedir que a aba compartilhada seja
  uma **aba/planilha "vitrine"** só com os campos públicos — a aba
  interna completa fica restrita.
- *Proxy saneador (recomendado se a ONG não puder mexer):* uma Edge
  Function na Vercel (`api/animais.js`) busca a planilha do lado do
  servidor, **descarta as colunas sensíveis**, responde só o subset
  público e faz cache (ex.: 5 min). Bônus: a URL da planilha sai do
  código público (vira variável de ambiente) e o gargalo de capacidade
  do §2 desaparece.

**A2: headers de segurança ausentes** — a produção só enviava HSTS.
Corrigido neste repositório via `vercel.json`: CSP (permitindo apenas
self + Google Fonts + endpoints da planilha), X-Frame-Options DENY,
X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.

**A3: repositório GitHub público.** Qualquer pessoa lê o código, os
manuais e a URL da planilha. Para o trabalho de disciplina isso é
aceitável e até desejável; em produção real com a ONG, recomenda-se
**tornar o repositório privado** (a Vercel suporta em todos os planos)
ou, no mínimo, remover a URL da planilha do código quando o proxy A1
existir. Nota: histórico do Git é permanente — se a URL da planilha
vier a ser sensível, a ONG deve restringir o compartilhamento dela
(pois a URL já circulou).

**A4: arquivos de documentação servidos publicamente** (`/docs/*.md`
respondem 200). Não contêm segredos hoje (contatos são públicos por
natureza), mas se um dia houver qualquer dado interno nos manuais,
adicionar rota de exclusão ou tirá-los do deploy.

**A5: conteúdo gerado pela planilha.** Os textos da planilha entram no
HTML por `innerHTML` (template strings). Hoje o risco é baixo (só a
ONG edita a planilha), mas se a planilha for colaborativa demais,
um `textContent`/escape no normalizador blinda contra HTML injetado
via planilha. Melhoria barata.

## 4. Campanhas: como a organização altera (e só ela)

Hoje as campanhas vivem no array `CAMPANHAS` em `js/data.js`.
Publicá-las exige fazer `git push` + `vercel deploy` — ou seja,
**de fato, só quem tem acesso de escrita ao repositório GitHub (ou à
conta Vercel) consegue mudar**. Para transformar isso de acaso em
política, três níveis possíveis:

- **Nível 1 — governança do repositório (fazer agora, sem código):**
  1. No GitHub: Settings → Collaborators → convidar APENAS pessoas da
     organização (remover quem não for).
  2. Settings → Branches → regra de proteção em `main`: exigir Pull
     Request + 1 revisão antes de qualquer merge. Assim nenhuma
     alteração (campanhas ou qualquer outra) entra sem aprovação da
     equipe.
  3. Na Vercel: deploy de produção restrito à conta do projeto
     (membros do time apenas).
- **Nível 2 — campanhas sem código (recomendado para a ONG):** mover
  as campanhas para uma **planilha própria "Campanhas"** (controlada
  pela organização, compartilhada como "qualquer pessoa com o link:
  visualizar"). O site passa a lê-la como lê os animais; a equipe da
  ONG edita campanha no Sheets sem tocar em código, e pessoas de fora
  não conseguem editar (só visualizar). Implementação: mesmo padrão
  do normalizador (`js/app.js`), apontando a aba no `js/config.js`.
- **Nível 3 — painel administrativo com login:** só se houver equipe
  técnica dedicada (Supabase/Firebase + auth). Para um site estático
  de ONG, custo/benefício desfavorável hoje.

O caminho sugerido: **Nível 1 imediatamente + Nível 2 quando a ONG
quiser autonomia** para editar campanhas sem passar pela equipe de
desenvolvimento.
