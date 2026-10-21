/* ============================================================
   CAMADA DE DADOS DA VITRINE DE ADOÇÃO
   ------------------------------------------------------------
   MODO "local" (padrão): a lista de animais vive no array
   ANIMAIS abaixo. Para cadastrar um animal novo, copie um
   bloco { ... }, troque os valores e salve. A foto deve ficar
   em assets/img/animais/ e o campo "foto" aponta para lá.

   MODO "sheets": quando a planilha estiver pronta, troque
   CONFIG.fonteDeDados para "sheets" em js/config.js — este
   arquivo deixa de ser usado e os animais passam a vir da
   planilha. O formato esperado das colunas está em
   docs/GOOGLE-SHEETS.md (é o mesmo dos campos abaixo).

   Campos:
     id          número único (não repita)
     nome        nome do animal
     especie     "cao" ou "gato"
     porte       "pequeno" | "medio" | "grande"
     idadeMeses  idade aproximada em meses
     sexo        "femea" ou "macho"
     castrado    true/false
     vacinado    true/false
     descricao   1–2 frases sobre o temperamento/história
     foto        caminho da imagem a partir da raiz do site
     status      "disponivel" | "urgente" | "adotado"
   ============================================================ */

const ANIMAIS = [
  {
    id: 1,
    nome: "Bidu",
    especie: "cao",
    porte: "medio",
    idadeMeses: 24,
    sexo: "macho",
    castrado: true,
    vacinado: true,
    descricao: "Brincalhão e carinhoso, adora correr no quintal e faz amizade fácil com todos.",
    foto: "assets/img/animais/bidu.svg",
    status: "disponivel",
  },
  {
    id: 2,
    nome: "Luna",
    especie: "gato",
    porte: "pequeno",
    idadeMeses: 8,
    sexo: "femea",
    castrado: true,
    vacinado: true,
    descricao: "Calminha e caseira, ama um colo quente e um bom lugar ao sol.",
    foto: "assets/img/animais/luna.svg",
    status: "disponivel",
  },
  {
    id: 3,
    nome: "Thor",
    especie: "cao",
    porte: "grande",
    idadeMeses: 48,
    sexo: "macho",
    castrado: true,
    vacinado: true,
    descricao: "Guardão de coração mole. Precisa de espaço e de alguém para caminhar junto.",
    foto: "assets/img/animais/thor.svg",
    status: "urgente",
  },
  {
    id: 4,
    nome: "Mel",
    especie: "cao",
    porte: "pequeno",
    idadeMeses: 14,
    sexo: "femea",
    castrado: false,
    vacinado: true,
    descricao: "Pequena no tamanho, gigante no afeto. Leve, dócil e ótima com crianças.",
    foto: "assets/img/animais/mel.svg",
    status: "disponivel",
  },
  {
    id: 5,
    nome: "Zé Carioca",
    especie: "gato",
    porte: "medio",
    idadeMeses: 30,
    sexo: "macho",
    castrado: true,
    vacinado: true,
    descricao: "Sociável com outros gatos, curioso e tagarela — responde quando conversam com ele.",
    foto: "assets/img/animais/ze-carioca.svg",
    status: "disponivel",
  },
  {
    id: 6,
    nome: "Nina",
    especie: "cao",
    porte: "medio",
    idadeMeses: 120,
    sexo: "femea",
    castrado: true,
    vacinado: true,
    descricao: "Senhora paciente, já criada dentro de casa. Merece um lar tranquilo para envelhecer amada.",
    foto: "assets/img/animais/nina.svg",
    status: "urgente",
  },
  {
    id: 7,
    nome: "Fiona",
    especie: "gato",
    porte: "pequeno",
    idadeMeses: 5,
    sexo: "femea",
    castrado: false,
    vacinado: false,
    descricao: "Filhote cheia de energia, brinha com tudo o que se mexe. Vai crescer no seu colo.",
    foto: "assets/img/animais/fiona.svg",
    status: "disponivel",
  },
  {
    id: 8,
    nome: "Salem",
    especie: "gato",
    porte: "medio",
    idadeMeses: 36,
    sexo: "macho",
    castrado: true,
    vacinado: true,
    descricao: "Independente, tranquilo e silencioso. O companheiro ideal para quem trabalha de casa.",
    foto: "assets/img/animais/salem.svg",
    status: "adotado",
  },
];

/* ============================================================
   CAMPANHAS EM ANDAMENTO
   ------------------------------------------------------------
   Cada campanha aparece na seção "Campanhas" da página inicial.
   - destaque: "true" apenas UMA campanha por vez (a do banner).
   - status "ativa" aparece no site; "encerrada" é ocultada.
   ============================================================ */

const CAMPANHAS = [
  {
    id: 1,
    titulo: "Campanha de Castração Solidária",
    resumo:
      "Cada R$ 180 custeia uma castração completa. Ajude a conter o " +
      "abandono na raiz — a meta deste mês é 40 cirurgias.",
    meta: 40,
    alcancado: 26,
    destaque: true,
    status: "ativa",
  },
  {
    id: 2,
    titulo: "Natal Pet Solidário",
    resumo:
      "Monte uma cesta de ração, remédios e cobertas para o inverno " +
      "dos nossos resgatados.",
    meta: 100,
    alcancado: 82,
    destaque: false,
    status: "ativa",
  },
];
