/* ============================================================
   CONFIGURAÇÕES GERAIS DO SITE
   ------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para trocar
   nome da ONG, contatos, redes sociais, chave Pix e a fonte de
   dados da vitrine de adoção. Veja docs/MANUTENCAO.md.
   ============================================================ */

const CONFIG = {

  /* Dados institucionais da ONG ------------------------------- */
  ong: {
    nome: "Anjos da Proteção Animal",                    // nome da ONG
    slogan: "Proteção e adoção responsável",
    descricaoCurta:
      "Somos uma ONG de proteção animal que resgata, recupera e " +
      "encaminha cães e gatos abandonados para adoção responsável.",
    cnpj: "00.000.000/0001-00",                  // substitua pelo CNPJ real
    endereco: "Rua Exemplo, 123 — Bairro, Cidade/UF",
    horario: "Sábados, 9h às 15h (visitas agendadas)",
    desde: 2015,                                 // ano de fundação (rodapé)
  },

  /* Contato e redes sociais ---------------------------------- */
  contato: {
    email: "contato@anjosdaprotecaoanimal.org.br",
    whatsapp: "5511999999999",                   // formato internacional, só números (55 + DDD + número)
    instagram: "https://instagram.com/anjosdaprotecaoanimal",
    facebook: "https://facebook.com/anjosdaprotecaoanimal",
  },

  /* Doações --------------------------------------------------- */
  doacao: {
    pix: "contato@anjosdaprotecaoanimal.org.br",       // chave Pix: e-mail, telefone, CPF/CNPJ ou aleatória
  },

  /* ============================================================
     FONTE DE DADOS DA VITRINE DE ADOÇÃO
     ------------------------------------------------------------
     "sheets" -> busca os animais direto da planilha Google
                 Sheets (aba "Table 2" da microchipagem). Basta
                 colar a URL normal da planilha abaixo — não é
                 preciso "publicar na web". A planilha precisa
                 estar compartilhada como "qualquer pessoa com
                 o link pode visualizar".

     "local"  -> volta a usar o array ANIMAIS definido em
                 js/data.js (plano B, caso a planilha saia do ar).
     ============================================================ */
  fonteDeDados: "sheets",

  sheets: {
    // URL da planilha (a mesma que você abre no navegador).
    planilhaUrl: "https://docs.google.com/spreadsheets/d/1cQ8pMk6pxnSBTzmvZLC10VQQq6X9shiH/edit?gid=1524271065#gid=1524271065",

    // Alternativa técnica: CSV publicado na web (deixe vazio
    // enquanto estiver usando planilhaUrl). Veja docs/GOOGLE-SHEETS.md.
    csvUrl: "",
  },
};
