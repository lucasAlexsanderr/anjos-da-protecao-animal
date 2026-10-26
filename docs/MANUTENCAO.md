# Manual de Manutenção — Site da ONG

Este documento explica tudo o que a equipe precisa saber para manter o site
atualizado **sem programar**. Qualquer pessoa com um editor de texto e um
navegador consegue executar os procedimentos abaixo.

---

## 1. Visão geral do projeto

```
anjos-da-protecao-animal/
├── index.html          → Página inicial (landing page)
├── adocao.html         → Vitrine completa de adoção (com filtros)
├── css/
│   └── style.css       → Aparência do site inteiro (cores, fontes, layout)
├── js/
│   ├── config.js       → ★ DADOS DA ONG: nome, contatos, Pix, redes
│   ├── data.js         → ★ CONTEÚDO: lista de animais e campanhas
│   └── app.js          → Lógica do site (não precisa editar)
├── assets/
│   └── img/
│       ├── favicon.svg     → Logotipo (ícone da aba do navegador)
│       └── animais/        → Fotos dos animais
├── docs/
│   ├── MANUTENCAO.md       → Este manual
│   └── GOOGLE-SHEETS.md    → Como conectar a planilha Google Sheets
└── README.md           → Instruções rápidas do projeto
```

★ = arquivos que você edita com frequência.

**Como o site funciona:** é um site estático (HTML + CSS + JavaScript),
sem servidor e sem banco de dados. A vitrine de adoção é montada no
navegador do visitante a partir de `js/data.js` (modo padrão) ou de uma
planilha Google Sheets (modo "sheets", veja `docs/GOOGLE-SHEETS.md`).

---

## 2. Cadastrar ou remover um animal (modo "local" — padrão)

### 2.1 Adicionar a foto

1. Salve a foto do animal em `assets/img/animais/` com um nome simples
   e sem espaços/acentos, ex.: `rex.jpg` (JPG, PNG ou WebP).
   - Dica: fotos na horizontal (proporção 4:3) ficam melhores nos cards.
2. O tamanho ideal é até ~500 KB. Sites como squoosh.app comprimem
   sem perder qualidade.

### 2.2 Cadastrar no site

Abra `js/data.js`, copie um bloco inteiro de `{` até `},` de um animal
existente e cole no final da lista (antes do `];`). Ajuste os valores:

```js
{
  id: 9,                    // número único — nunca repita (use o próximo da sequência)
  nome: "Rex",
  especie: "cao",           // "cao" ou "gato"
  porte: "medio",           // "pequeno" | "medio" | "grande"
  idadeMeses: 18,           // idade aproximada em MESES (18 = 1 ano e meio)
  sexo: "macho",            // "macho" ou "femea"
  castrado: true,           // true = sim | false = não
  vacinado: true,           // true = sim | false = não
  descricao: "Uma frase curta sobre o temperamento e a história dele.",
  foto: "assets/img/animais/rex.jpg",   // caminho da foto do passo 2.1
  status: "disponivel",    // "disponivel" | "urgente" | "adotado"
},
```

Depois salve o arquivo e recarregue o site. Pronto — o animal aparece
na home (prévia) e na página de adoção automaticamente.

### 2.3 Marcar como adotado

Não apague o animal: troque `"status": "disponivel"` por
`"status": "adotado"`. Ele sai da vitrine e do filtro, mas o registro
fica guardado.

### 2.4 Remover um animal

Apague o bloco inteiro (de `{` até `},`) da lista `ANIMAIS` em
`js/data.js`.

> **Atenção ao modo "sheets":** quando a fonte de dados passar a ser a
> planilha Google Sheets (veja `docs/GOOGLE-SHEETS.md`), os animais são
> cadastrados **na planilha**, não em `js/data.js` — e este item deixa de
> se aplicar.

---

## 3. Atualizar campanhas

Abra `js/data.js` e edite o array `CAMPANHAS`:

- `status: "ativa"` → aparece no site | `"encerrada"` → é ocultada.
- `destaque: true` → vira o banner grande. **Deixe apenas UMA campanha
  em destaque por vez.**
- `meta` / `alcancado` → controlam a barra de progresso (ex.: 26 de 40).

Para criar uma campanha nova, copie um bloco e troque os valores. Para
remover, apague o bloco inteiro.

---

## 4. Trocar dados da ONG (nome, contatos, Pix, redes)

Tudo fica em **um único arquivo: `js/config.js`**.

| O que trocar            | Campo em `js/config.js`                          |
|-------------------------|--------------------------------------------------|
| Nome da ONG             | `CONFIG.ong.nome` (aparece no menu e rodapé)     |
| CNPJ                    | `CONFIG.ong.cnpj`                                |
| Endereço / horário      | `CONFIG.ong.endereco` / `CONFIG.ong.horario`     |
| E-mail de contato       | `CONFIG.contato.email`                           |
| WhatsApp                | `CONFIG.contato.whatsapp` (55 + DDD + número)    |
| Instagram / Facebook    | `CONFIG.contato.instagram` / `.facebook`         |
| Chave Pix               | `CONFIG.doacao.pix`                              |

**Importante:** alguns textos "soltos" estão direto no HTML (ex.: o e-mail
na seção de Contato e os links de redes no rodapé). Se trocar e-mail ou
redes, procure o texto antigo em `index.html` e `adocao.html` com
Ctrl+F e substitua.

---

## 5. Atualizar os números de impacto (home)

Na página inicial há uma faixa com três números (resgatados, adoções,
parceiros). Eles estão escritos direto em `index.html`, na seção
comentada com `<!-- ATENÇÃO: atualize estes números periodicamente -->`.
Edite os valores e salve.

> Para o trabalho da disciplina: estes são valores ilustrativos.
> Em produção, substitua pelos dados reais da ONG.

---

## 6. Trocar cores, fontes e logotipo

- **Cores:** no topo de `css/style.css` há o bloco `:root` com os
  "tokens". Eles foram extraídos da logo oficial (magenta #E42E82,
  creme #FAF3D3). Troque `--accent` e `--bg` para mudar a identidade
  visual inteira de uma vez.
- **Logotipo:** a logo oficial é `assets/img/logo.webp` — substitua
  esse arquivo (mantendo o nome) para trocar a marca do menu, do
  rodapé. O ícone da aba do navegador é `assets/img/favicon.svg`
  (recolore com a paleta).
- **Fontes:** as fontes (Baloo 2 para a marca, Fraunces e DM Sans)
  vêm do Google Fonts, declaradas no `<head>` dos dois HTML. Troque o
  link e as variáveis `--font-marca` / `--font-head` / `--font-body`
  no CSS.

---

## 7. Rodar e testar localmente

O site abre direto com dois cliques em `index.html`, mas a vitrine de
adoção (quando usar o modo "sheets") requer um servidor local:

```bash
# na pasta do projeto:
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Checklist de teste rápido antes de publicar qualquer alteração:

1. Abrir `index.html` e `adocao.html` no navegador.
2. Testar no modo responsivo (F12 → ícone de celular): menu hambúrguer
   abre e fecha, cards empilham em 1 coluna no celular.
3. Clicar em "Quero adotar" → WhatsApp abre com a mensagem correta.
4. Clicar em "Copiar chave Pix" → chave copiada.
5. Preencher o formulário de contato → abre o e-mail com a mensagem.
6. Na página de adoção: usar filtros e a busca por nome.

---

## 8. Publicar o site (deploy)

Por ser estático, qualquer hospedagem gratuita serve:

**GitHub Pages**
1. Crie um repositório no GitHub e envie os arquivos.
2. Em Settings → Pages, escolha a branch `main` e a pasta raiz.
3. O site fica em `https://usuario.github.io/anjos-da-protecao-animal/`.

**Netlify (arrastar e soltar, sem Git)**
1. Acesse app.netlify.com e arraste a pasta do projeto para o painel.
2. O site sobe em segundos com endereço próprio (pode colocar domínio
   próprio depois).

**Vercel** — conecte o repositório do GitHub; a cada `git push` o site
é republicado automaticamente.

---

## 9. Manutenção periódica (checklist mensal)

- [ ] Conferir se todos os animais da vitrine estão com foto e status corretos.
- [ ] Atualizar `meta`/`alcancado` das campanhas ativas.
- [ ] Atualizar os números da faixa de impacto em `index.html`.
- [ ] Marcar como "adotado" os animais que saíram naquele mês.
- [ ] Testar o site no celular (filtros, WhatsApp, formulário).
- [ ] Conferir a chave Pix e os contatos em `js/config.js`.

---

## 10. Alterar comportamento (para quem for programar)

`js/app.js` concentra a lógica: carregamento de dados (local ou Sheets),
renderização dos cards, filtros, formulário e menu. Regras de ouro:

- Conteúdo novo → `js/config.js` ou `js/data.js` (nunca copie texto
  fixo dentro de `app.js`).
- Antes de qualquer mudança estrutural, faça backup da pasta (ou use
  Git — recomendado).
- Teste no navegador e confira o Console (F12) para erros de JavaScript
  após cada edição.
