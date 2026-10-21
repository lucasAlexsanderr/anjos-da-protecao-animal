# Site da ONG Anjos da Proteção Animal

- Site no ar: https://anjos-da-protecao-animal.vercel.app
- Repositório: https://github.com/lucasAlexsanderr/anjos-da-protecao-animal

Landing page responsiva para uma ONG de proteção animal: vitrine de
adoção, campanhas, doações (Pix) e contato. Site 100% estático — sem
servidor, sem dependências além das fontes do Google Fonts.

## Estrutura

- `index.html` — landing page (hero, impacto, como ajudar, prévia da
  vitrine, passo a passo da adoção, campanhas, contato).
- `adocao.html` — vitrine completa com busca e filtros (espécie,
  porte, idade, sexo).
- `js/config.js` — dados da ONG (nome, contatos, Pix, redes) e a chave
  da fonte de dados. **Ponto único de edição.**
- `js/data.js` — animais e campanhas (modo "local").
- `js/app.js` — lógica: vitrine, filtros, formulário, menu, leitura de
  Google Sheets (CSV).
- `css/style.css` — design system completo.
- `docs/MANUTENCAO.md` — manual de alimentação e manutenção.
- `docs/GOOGLE-SHEETS.md` — como conectar a planilha Google Sheets.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

(Também funciona abrindo `index.html` com dois cliques no modo "local".)

## Integrar com o Google Sheets (futuro)

1. Monte a planilha conforme `docs/GOOGLE-SHEETS.md`.
2. Em `js/config.js`, troque `fonteDeDados` para `"sheets"` e cole a
   URL de publicação CSV em `sheets.csvUrl`.

## Publicar

GitHub Pages, Netlify ou Vercel — instruções no manual de manutenção.

---

*Projeto da disciplina de Intercursos. Nome da ONG, CNPJ, contatos,
números de impacto e animais são ilustrativos — substitua pelos dados
reais via `js/config.js` e `index.html`.*
