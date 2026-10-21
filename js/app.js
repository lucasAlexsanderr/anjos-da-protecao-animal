/* ============================================================
   ANJOS DA PROTEÇÃO ANIMAL — lógica do site
   ------------------------------------------------------------
   Você normalmente NÃO precisa editar este arquivo para
   atualizar o site. Conteúdo (animais, campanhas, contatos,
   textos institucionais) vive em js/config.js e js/data.js.
   Este arquivo só precisa mudar se o COMPORTAMENTO do site
   mudar (novos filtros, novo formulário etc.).
   ============================================================ */

"use strict";

/* ---------- Utilidades de texto ---------- */

const idadeTexto = (meses) => {
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
};

const ROTULOS = {
  cao: "Cão", gato: "Gato",
  pequeno: "Pequeno", medio: "Médio", grande: "Grande",
  femea: "Fêmea", macho: "Macho",
  disponivel: "Disponível", urgente: "Urgente", adotado: "Adotado",
};

const rotulo = (chave) => ROTULOS[chave] || chave;

/* ---------- Carregamento de animais (local OU Google Sheets) ---------- */

let _cacheAnimais = null;

async function carregarAnimais() {
  if (_cacheAnimais) return _cacheAnimais;

  if (CONFIG.fonteDeDados === "sheets" && CONFIG.sheets.csvUrl) {
    try {
      const resp = await fetch(CONFIG.sheets.csvUrl);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      _cacheAnimais = parseCSVAnimais(await resp.text());
      return _cacheAnimais;
    } catch (erro) {
      console.error("Falha ao carregar a planilha:", erro);
      mostrarErroVitrine();
      return [];
    }
  }

  // Modo local (padrão): dados do array ANIMAIS em js/data.js
  _cacheAnimais = ANIMAIS;
  return _cacheAnimais;
}

/* Parser de CSV simples, com suporte a campos entre aspas. */
function parseCSV(texto) {
  const linhas = [];
  let linha = [], campo = "", emAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (emAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') { emAspas = false; }
      else campo += c;
    } else if (c === '"') emAspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    } else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/* Converte o CSV publicado da planilha em objetos "animal".
   As colunas esperadas estão em docs/GOOGLE-SHEETS.md. */
function parseCSVAnimais(texto) {
  const linhas = parseCSV(texto);
  if (linhas.length < 2) return [];
  const cab = linhas[0].map((c) => c.trim().toLowerCase());
  const idx = (nome) => cab.indexOf(nome);
  return linhas.slice(1).map((l, n) => ({
    id: l[idx("id")] || n + 1,
    nome: l[idx("nome")] || "",
    especie: (l[idx("especie")] || "").toLowerCase(),
    porte: (l[idx("porte")] || "").toLowerCase(),
    idadeMeses: parseInt(l[idx("idademeses")] || "0", 10) || 0,
    sexo: (l[idx("sexo")] || "").toLowerCase(),
    castrado: l[idx("castrado")]?.toLowerCase() === "sim" || l[idx("castrado")] === "true",
    vacinado: l[idx("vacinado")]?.toLowerCase() === "sim" || l[idx("vacinado")] === "true",
    descricao: l[idx("descricao")] || "",
    foto: l[idx("foto")] || "assets/img/animais/sem-foto.svg",
    status: (l[idx("status")] || "disponivel").toLowerCase(),
  }));
}

/* ---------- Cards da vitrine ---------- */

function cardAnimalHTML(a) {
  const badge = a.status !== "disponivel"
    ? `<span class="badge ${a.status === "adotado" ? "adotado" : ""}">${rotulo(a.status)}</span>`
    : "";
  const disponivel = a.status !== "adotado";
  const msg = `Olá! Vi o ${a.especie === "gato" ? "gato" : "cão"} ${a.nome} no site e gostaria de saber mais sobre a adoção. 💛`;
  const acao = disponivel
    ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener"
         href="https://wa.me/${CONFIG.contato.whatsapp}?text=${encodeURIComponent(msg)}">
         Quero adotar</a>`
    : `<span class="btn btn-ghost btn-sm" style="pointer-events:none">Já tem lar 💚</span>`;

  return `
  <article class="card-animal reveal">
    <div class="foto">${badge}<img src="${a.foto}" alt="Foto de ${a.nome}" loading="lazy"></div>
    <div class="corpo">
      <h3>${a.nome} <span class="meta">${rotulo(a.especie)}</span></h3>
      <p class="meta">${idadeTexto(a.idadeMeses)} · ${rotulo(a.porte)} · ${rotulo(a.sexo)}</p>
      <p class="desc">${a.descricao}</p>
      <div class="marcas">
        ${a.castrado ? "<span>Castrado</span>" : ""}
        ${a.vacinado ? "<span>Vacinado</span>" : ""}
      </div>
      ${acao}
    </div>
  </article>`;
}

function mostrarErroVitrine() {
  const alvo = document.querySelector("[data-vitrine]");
  if (!alvo) return;
  alvo.innerHTML = `
    <div class="vazio" style="grid-column:1/-1">
      <strong>Não foi possível carregar a lista agora.</strong>
      Atualize a página em alguns instantes ou fale com a gente pelo WhatsApp.
    </div>`;
}

async function renderVitrine() {
  const alvo = document.querySelector("[data-vitrine]");
  if (!alvo) return;
  const limite = parseInt(alvo.dataset.limite || "0", 10);
  const esqueletos = alvo.querySelectorAll(".skeleton");

  const animais = await carregarAnimais();
  esqueletos.forEach((s) => s.remove());
  if (!animais.length) return;

  const lista = limite ? animais.filter((a) => a.status !== "adotado").slice(0, limite) : animais.filter((a) => a.status !== "adotado");
  alvo.innerHTML = lista.map(cardAnimalHTML).join("");
  observarReveals();
}

/* ---------- Página de adoção: filtros ---------- */

const filtrosEstado = { busca: "", especie: "todos", porte: "todos", sexo: "todos", faixa: "todos" };

function animalPassa(a, f) {
  if (f.busca && !a.nome.toLowerCase().includes(f.busca)) return false;
  if (f.especie !== "todos" && a.especie !== f.especie) return false;
  if (f.porte !== "todos" && a.porte !== f.porte) return false;
  if (f.sexo !== "todos" && a.sexo !== f.sexo) return false;
  if (f.faixa === "filhote" && a.idadeMeses >= 12) return false;
  if (f.faixa === "adulto" && (a.idadeMeses < 12 || a.idadeMeses >= 96)) return false;
  if (f.faixa === "idoso" && a.idadeMeses < 96) return false;
  return true;
}

async function renderAdocao() {
  const alvo = document.querySelector("[data-vitrine-completa]");
  if (!alvo) return;
  const animais = await carregarAnimais();
  if (!animais.length) return;

  function aplicar() {
    const visiveis = animais.filter((a) => a.status !== "adotado" && animalPassa(a, filtrosEstado));
    alvo.innerHTML = visiveis.length
      ? visiveis.map(cardAnimalHTML).join("")
      : `<div class="vazio" style="grid-column:1/-1">
           <strong>Nenhum animal encontrado com esses filtros.</strong>
           Tente ampliar a busca — novos resgatados chegam toda semana.
         </div>`;
    const info = document.querySelector("[data-contador]");
    if (info) info.textContent = `${visiveis.length} ${visiveis.length === 1 ? "animal disponível" : "animais disponíveis"}`;
    observarReveals();
  }

  const busca = document.querySelector("[data-f-busca]");
  if (busca) busca.addEventListener("input", () => { filtrosEstado.busca = busca.value.trim().toLowerCase(); aplicar(); });

  document.querySelectorAll("[data-f-especie]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-f-especie]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      filtrosEstado.especie = chip.dataset.fEspecie;
      aplicar();
    });
  });

  for (const campo of ["porte", "sexo", "faixa"]) {
    const el = document.querySelector(`[data-f-${campo}]`);
    if (el) el.addEventListener("change", () => { filtrosEstado[campo] = el.value; aplicar(); });
  }

  aplicar();
}

/* ---------- Campanhas (página inicial) ---------- */

function renderCampanhas() {
  const destaqueEl = document.querySelector("[data-campanha-destaque]");
  const listaEl = document.querySelector("[data-campanhas-lista]");
  if (!destaqueEl && !listaEl) return;

  const ativas = CAMPANHAS.filter((c) => c.status === "ativa");
  const destaque = ativas.find((c) => c.destaque);
  const demais = ativas.filter((c) => c !== destaque);

  if (destaqueEl) {
    if (!destaque) { destaqueEl.closest(".campanha-destaque")?.remove(); }
    else {
      const pct = Math.min(100, Math.round((destaque.alcancado / destaque.meta) * 100));
      destaqueEl.innerHTML = `
        <div>
          <p class="rotulo">Campanha em destaque</p>
          <h3>${destaque.titulo}</h3>
          <p>${destaque.resumo}</p>
          <a class="btn btn-primary" target="_blank" rel="noopener"
             href="https://wa.me/${CONFIG.contato.whatsapp}?text=${encodeURIComponent("Olá! Quero contribuir com a campanha " + destaque.titulo + ".")}">
             Quero contribuir</a>
        </div>
        <div class="progresso">
          <div class="barra"><span style="width:${pct}%"></span></div>
          <small>${destaque.alcancado} de ${destaque.meta} alcançado · ${pct}%</small>
        </div>`;
    }
  }

  if (listaEl) {
    listaEl.innerHTML = demais.map((c) => {
      const pct = Math.min(100, Math.round((c.alcancado / c.meta) * 100));
      return `<li class="reveal">
        <h3>${c.titulo}</h3>
        <p style="color:var(--muted);font-size:.95rem;margin-top:.4rem">${c.resumo}</p>
        <div class="progresso">
          <div class="barra"><span style="width:${pct}%"></span></div>
          <small>${c.alcancado} de ${c.meta} · ${pct}%</small>
        </div>
      </li>`;
    }).join("");
    if (!demais.length) listaEl.remove();
  }
}

/* ---------- Formulário de contato (sem back-end) ---------- */

function montarFormularioContato() {
  const form = document.querySelector("[data-form-contato]");
  if (!form) return;

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());
    const assunto = `[Site] ${dados.assunto || "Contato"} — ${dados.nome}`;
    const corpo =
      `Nome: ${dados.nome}\n` +
      `E-mail: ${dados.email}\n` +
      (dados.telefone ? `Telefone/WhatsApp: ${dados.telefone}\n` : "") +
      `\nMensagem:\n${dados.mensagem}\n`;
    location.href =
      `mailto:${CONFIG.contato.email}` +
      `?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  });
}

/* ---------- Copiar chave Pix ---------- */

function montarBotaoPix() {
  document.querySelectorAll("[data-copiar-pix]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const chave = CONFIG.doacao.pix;
      try {
        await navigator.clipboard.writeText(chave);
        const original = btn.textContent;
        btn.textContent = "Chave copiada!";
        setTimeout(() => (btn.textContent = original), 2200);
      } catch {
        prompt("Copie a chave Pix:", chave);
      }
    });
  });
}

/* ---------- Navegação mobile ---------- */

function montarMenuMobile() {
  const botao = document.querySelector("[data-btn-menu]");
  const menu = document.querySelector("[data-menu]");
  if (!botao || !menu) return;

  const alternar = (aberto) => {
    menu.classList.toggle("aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };

  botao.addEventListener("click", () => alternar(!menu.classList.contains("aberto")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => alternar(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
}

/* ---------- Animação de entrada ---------- */

let _observer = null;
function observarReveals() {
  const els = document.querySelectorAll(".reveal:not(.visivel)");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("visivel")); return; }
  if (!_observer) {
    _observer = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visivel"); _observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
  }
  els.forEach((el) => _observer.observe(el));
}

/* ---------- Preenchimentos automáticos ---------- */

function preencherInstitucional() {
  document.querySelectorAll("[data-ano-atual]").forEach((el) => (el.textContent = new Date().getFullYear()));
  document.querySelectorAll("[data-desde]").forEach((el) => (el.textContent = CONFIG.ong.desde));
  document.querySelectorAll("[data-ong-nome]").forEach((el) => (el.textContent = CONFIG.ong.nome));
  document.querySelectorAll("[data-cnpj]").forEach((el) => (el.textContent = CONFIG.ong.cnpj));
  document.querySelectorAll("[data-pix]").forEach((el) => (el.textContent = CONFIG.doacao.pix));
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => (el.href = `https://wa.me/${CONFIG.contato.whatsapp}`));
}

/* ---------- Inicialização ---------- */

document.addEventListener("DOMContentLoaded", () => {
  preencherInstitucional();
  montarMenuMobile();
  montarFormularioContato();
  montarBotaoPix();
  renderCampanhas();
  renderVitrine();
  renderAdocao();
  observarReveals();
});
