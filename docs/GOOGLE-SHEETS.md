# Integração com Google Sheets (planilha de microchipagem)

A vitrine de adoção é alimentada pela planilha real de microchipagem
dos animais, mantida no Google Sheets. **Não é preciso editar a
planilha nem "publicar na web"** — basta que ela esteja compartilhada
como "qualquer pessoa com o link pode visualizar" (como já está).

- Planilha: "Planilha de microchipagem de Animais" (aba/gid 1524271065)
- Configuração no site: `js/config.js` → `CONFIG.sheets.planilhaUrl`
- Fonte ativa: `CONFIG.fonteDeDados: "sheets"`

---

## 1. Como o site lê a planilha (sem back-end)

Ao abrir o site, o navegador busca os dados direto do Google:

1. **CSV de exportação** (fonte primária):
   `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>`
   via `fetch()`. O Google permite esse acesso entre origens (CORS)
   quando a planilha está compartilhada por link. Retorna os dados
   completos, inclusive valores de texto na coluna numérica "Idade"
   (ex.: "MESES" = filhote).
2. **Endpoint gviz via JSONP** (fallback automático): se o CSV falhar,
   o site carrega o endpoint `gviz/tq` com uma tag `<script>`. Esse
   caminho ignora restrições de CORS, mas o gviz descarta valores não
   numéricos de colunas numéricas — os filhotes "MESES" aparecem como
   "idade não informada" quando ele é usado.

Cada visitante recebe os dados no ato: qualquer alteração na planilha
aparece no site em minutos (o Google mantém um cache curto).

## 2. Como a planilha é interpretada (normalização)

A planilha não foi desenhada para o site, então o código traduz as
colunas e os valores, tolerando variações de grafia:

| Coluna da planilha  | Como o site usa                                            |
|---------------------|-------------------------------------------------------------|
| Nome                | Nome do card (convertido para Capitalizada)                 |
| Espécie             | FELINO → Gato · CANINO/CANINA/DOG → Cão                     |
| Sexo                | FEMEA → Fêmea · MACHO → Macho                               |
| Idade               | número em ANOS → "N anos" · "MESES" → "Filhote" · vazio → "Idade não informada" |
| Porte               | PEQUENO/MEDIO/GRANDE (maioria vazia → não exibido)          |
| Comportamento       | DÓCIL/DOCIL → "Dócil e tranquilo(a)" · BRAVA/BRAVO → "Bravo(a)" · ARISCA/ARISCO → "Arisco(a)" · TEMPERAMENTAL |
| Castração / Vacinação | SIM → chips "Castrado" / "Vacinado" no card              |
| Cor                 | Chip adicional no card (ex.: "Rajada")                      |
| Uso de medicação contínua | Se preenchida (e não for "NÃO"), vira o chip "Medicação: ..." no card |
| Doença Crônica / demais colunas | **Não exibidas** (dado clínico sensível ou irrelevante para o público) |
| Foto (não existe na planilha) | Controlada pelo manifesto `FOTOS` em `js/data.js`; sem registro → placeholder + aviso "Sem foto no site" + botão "Adicionar fotografia" |

Regras de exclusão:

- Linhas sem **Nome** ou sem **Espécie** reconhecível não entram na
  vitrine.
- Como a planilha não tem colunas de foto e status: todos recebem
  foto placeholder por espécie (`assets/img/animais/sem-foto-*.svg`)
  e status "disponível".

## 3. Filtros da página de adoção x dados reais

- **Espécie/sexo**: funcionam para todos (dados sempre presentes).
- **Porte**: só os poucos animais com porte preenchido aparecem ao
  filtrar.
- **Idade (faixa)**: filhotes ("MESES") e idosos (8+ anos) são
  filtráveis; animais sem idade informada aparecem apenas em
  "todas as idades".

## 4. Se algo der errado

| Problema                                  | Causa provável / ação                                                                 |
|--------------------------------------------|----------------------------------------------------------------------------------------|
| Vitrine mostra mensagem de erro            | Compartilhamento da planilha mudou de "qualquer pessoa com o link" para restrito        |
| Filhotes aparecem como "idade não informada" | O fallback gviz foi usado (CSV bloqueado). Recarregue; se persistir, verifique o item acima |
| Animal novo não aparece                    | Confira se a linha tem Nome e Espécie preenchidos; aguarde o cache do Google (minutos)   |
| Nome com grafia estranha no card           | O site capitaliza o texto como está na planilha — corrija na planilha                    |

Plano B: se a planilha sair do ar definitivamente, troque
`fonteDeDados` para `"local"` em `js/config.js` — a vitrine volta a
usar o array `ANIMAIS` em `js/data.js`.

## 5. Registro técnico (para a disciplina)

- Leitura client-side, sem servidor próprio: `fetch()` do CSV de
  exportação do Google Sheets + fallback JSONP no endpoint gviz
  (`js/app.js`, funções `carregarSheetsCSV`, `carregarGviz`,
  `normalizarLinhas`).
- Parser CSV próprio (suporta campos entre aspas) — `parseCSV`.
- Normalização tolerante a variações (acentos, caixa, sinônimos)
  documentada na seção 2.
- Alternativas consideradas e descartadas: Apps Script (exigiria
  acesso de edição à planilha, que não temos) e proxy CORS de
  terceiros (dependência externa desnecessária).
