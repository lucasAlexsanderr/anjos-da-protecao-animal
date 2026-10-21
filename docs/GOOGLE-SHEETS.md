# Integração com Google Sheets

O banco de dados dos animais será mantido em uma planilha **Google
Sheets**. O site já está preparado para isso: a leitura da planilha está
implementada em `js/app.js` e é ativada trocando **uma linha** de
configuração.

Existem dois modos:

| Modo        | Onde ficam os dados            | Quando usar                     |
|-------------|--------------------------------|---------------------------------|
| `"local"`   | Array em `js/data.js`         | Hoje (planilha ainda não existe) |
| `"sheets"`  | Planilha Google Sheets        | Quando a planilha estiver pronta |

---

## 1. Criar a planilha

1. Crie uma planilha nova em sheets.google.com.
2. Renomeie a primeira aba para `animais` (exatamente assim, sem acento).
3. Na **linha 1**, crie o cabeçalho com ESTAS colunas, nesta ordem
   (o site encontra as colunas pelo nome, em minúsculas):

| Coluna        | Conteúdo                                            | Exemplo               |
|---------------|-----------------------------------------------------|-----------------------|
| `id`          | número único                                        | `9`                   |
| `nome`        | nome do animal                                      | `Rex`                 |
| `especie`     | `cao` ou `gato`                                     | `cao`                 |
| `porte`       | `pequeno`, `medio` ou `grande`                      | `medio`               |
| `idademeses`  | idade em meses (só número)                          | `18`                  |
| `sexo`        | `femea` ou `macho`                                  | `macho`               |
| `castrado`    | `sim` ou `nao`                                      | `sim`                 |
| `vacinado`    | `sim` ou `nao`                                      | `sim`                 |
| `descricao`   | 1–2 frases sobre o animal                           | `Calmíssimo, ama...`  |
| `foto`        | URL pública da foto OU caminho local                | ver observação abaixo |
| `status`      | `disponivel`, `urgente` ou `adotado`                | `disponivel`          |

4. A partir da linha 2, cadastre um animal por linha.

### Sobre a coluna `foto`

- **Opção A (mais simples):** hospede a foto em um serviço com link
  direto (ex.: postar no Instagram da ONG não serve; use GitHub, Drive
  compartilhado "qualquer pessoa com o link" ou Imgur) e cole a URL
  completa na planilha, ex.: `https://.../rex.jpg`.
- **Opção B (local):** salve a foto em `assets/img/animais/rex.jpg`
  junto do site e escreva o caminho: `assets/img/animais/rex.jpg`.

---

## 2. Publicar a planilha na web (gerar o link CSV)

O site lê a planilha por meio de um link **público em formato CSV**:

1. Na planilha: **Arquivo → Compartilhar → Publicar na web**.
2. Em "Conteúdo publicado", escolha a aba **animais**.
3. Formato: **Valores separados por vírgulas (.csv)**.
4. Clique em **Publicar** e copie a URL gerada
   (algo como `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`).

> Atenção: "Publicar na web" é diferente de "Compartilhar". O link de
> publicação mostra apenas o conteúdo da aba publicada, no formato CSV.
> Qualquer pessoa com o link consegue VER os dados publicados — por isso
> a planilha não deve conter dados sensíveis (endereços de adotantes,
> telefones etc.).

---

## 3. Ativar a integração no site

Abra `js/config.js` e altere:

```js
fonteDeDados: "sheets",

sheets: {
  csvUrl: "COLE AQUI A URL DE PUBLICAÇÃO CSV",
},
```

Pronto. Salve, recarregue o site e a vitrine passa a ler os animais da
planilha.

> Como o CSV é lido no navegador do visitante, a atualização é quase
  imediata: cada visitante novo vê a versão mais recente da planilha
  (o Google pode manter um cache de até alguns minutos).

---

## 4. Como cadastrar animais daí em diante

Tudo passa a ser feito **na planilha** — não é preciso tocar no código:

- **Novo animal:** adicione uma linha com todas as colunas preenchidas.
- **Adotado:** troque o `status` da linha para `adotado` (ele sai da
  vitrine automaticamente).
- **Urgente:** troque o `status` para `urgente` (ganha selo vermelho).
- **Removido:** apague a linha.

Cuidados:

- Não renomeie o cabeçalho nem mude a ordem das colunas com o site
  dependendo delas (o site procura pelo nome da coluna; nomes errados
  quebram o campo correspondente).
- Não deixe linhas em branco no meio da tabela.
- Use `sim`/`nao` nas colunas castrado/vacinado e escreva `idademeses`
  apenas com o número (18, não "1 ano e meio").

---

## 5. Se algo der errado

| Problema                                          | O que verificar                                                                 |
|---------------------------------------------------|---------------------------------------------------------------------------------|
| Vitrine vazia / mensagem de erro                  | O Console do navegador (F12) mostra o motivo; normalmente a URL do CSV está errada ou a publicação foi desfeita |
| Animal não aparece                                | Colunas do cabeçalho escritas diferente do padrão; status inválido              |
| Foto não carrega                                  | URL da foto não é pública ou o caminho local está errado                        |
| Idade estranha                                     | `idademeses` com texto em vez de número                                         |

Se precisar voltar ao modo anterior rapidamente, basta trocar
`fonteDeDados` de volta para `"local"` — o array em `js/data.js` volta
a alimentar o site.

---

## 6. Alternativa técnica (registro, para a disciplina)

O site consome o endpoint de publicação CSV do Google Sheets
(`docs.google.com/spreadsheets/d/e/.../pub?output=csv`) via `fetch()`,
com um parser CSV próprio que suporta campos entre aspas
(`js/app.js`, função `parseCSVAnimais`). Nenhuma API key é necessária,
pois o conteúdo é público. Alternativas possíveis, se a disciplina
pedir mais robustez:

- **gviz JSON:** endpoint `.../gviz/tq?tqx=out:json` retorna JSON
  (exige outro parser).
- **Apps Script:** um `doGet()` que responde JSON, para validar/limpar
  os dados antes de exibir.
