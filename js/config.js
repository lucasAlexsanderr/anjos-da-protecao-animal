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
     "local"  -> usa o array ANIMAIS definido em js/data.js
                 (modo padrão; edite a lista ali para cadastrar
                  ou remover animais).

     "sheets" -> busca os animais direto de uma planilha
                 Google Sheets publicada. Aponte a URL do CSV
                 abaixo e siga docs/GOOGLE-SHEETS.md.
     ============================================================ */
  fonteDeDados: "local",

  sheets: {
    // URL do CSV publicado: na planilha, use
    // Arquivo > Compartilhar > Publicar na web > selecione a
    // aba "animais" e o formato "Valores separados por vírgula
    // (.csv)" > copie o link gerado e cole aqui.
    csvUrl: "",
  },
};
