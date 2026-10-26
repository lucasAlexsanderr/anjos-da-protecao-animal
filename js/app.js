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
  if (!meses) return "Idade não informada";
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

  if (CONFIG.fonteDeDados === "sheets") {
    if (CONFIG.sheets.planilhaUrl) {
      // 1ª opção: CSV de exportação (dados completos, ex.: "MESES")
      try {
        _cacheAnimais = await carregarSheetsCSV(CONFIG.sheets.planilhaUrl);
        return _cacheAnimais;
      } catch (erro) {
        console.warn("CSV de exportação falhou, tentando gviz:", erro);
        // 2ª opção: endpoint gviz via JSONP
        try {
          _cacheAnimais = await carregarGviz(CONFIG.sheets.planilhaUrl);
          return _cacheAnimais;
        } catch (erro2) {
          console.error("Falha ao carregar a planilha:", erro2);
          mostrarErroVitrine();
          return [];
        }
      }
    }
    // Alternativa: CSV publicado na web (ver docs/GOOGLE-SHEETS.md)
    if (CONFIG.sheets.csvUrl) {
      try {
        const resp = await fetch(CONFIG.sheets.csvUrl);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const linhas = parseCSV(await resp.text());
        if (linhas.length < 2) throw new Error("planilha vazia");
        _cacheAnimais = normalizarLinhas(linhas[0], linhas.slice(1));
        return _cacheAnimais;
      } catch (erro) {
        console.error("Falha ao carregar a planilha:", erro);
        mostrarErroVitrine();
        return [];
      }
    }
  }

  // Modo local (padrão): dados do array ANIMAIS em js/data.js
  _cacheAnimais = ANIMAIS;
  return _cacheAnimais;
}

/* ============================================================
   Leitura de planilha Google Sheets COMPARTILHADA POR LINK
   ------------------------------------------------------------
   Não é preciso "publicar na web": o endpoint gviz do Google
   é carregado via JSONP (tag <script>), que o navegador aceita
   de qualquer origem. CONFIG.sheets.planilhaUrl é a URL normal
   de edição da planilha (com ou sem ?gid=...).
   ============================================================ */

/* Extrai id e gid de uma URL do Google Sheets. */
function partesDaUrl(url) {
  const mId = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!mId) throw new Error("URL da planilha inválida");
  const mGid = String(url).match(/[#&?]gid=([0-9]+)/);
  return { id: mId[1], gid: mGid ? mGid[1] : "0" };
}

/* Busca o CSV de exportação da planilha compartilhada por link. */
async function carregarSheetsCSV(urlPlanilha) {
  const { id, gid } = partesDaUrl(urlPlanilha);
  const resp = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  const linhas = parseCSV(await resp.text());
  if (linhas.length < 2) throw new Error("planilha vazia");
  return normalizarLinhas(linhas[0], linhas.slice(1));
}

function carregarGviz(urlPlanilha) {
  return new Promise((resolve, reject) => {
    let id, gid;
    try { ({ id, gid } = partesDaUrl(urlPlanilha)); }
    catch (e) { reject(e); return; }

    const cb = "__gviz_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const limpar = () => { delete window[cb]; script.remove(); };
    const timer = setTimeout(() => { limpar(); reject(new Error("tempo esgotado ao carregar a planilha")); }, 15000);

    window[cb] = (resposta) => {
      clearTimeout(timer); limpar();
      try { resolve(parseGvizAnimais(resposta)); }
      catch (e) { reject(e); }
    };

    script.onerror = () => { clearTimeout(timer); limpar(); reject(new Error("não foi possível acessar a planilha (compartilhamento 'qualquer pessoa com o link'?)")); };
    script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json;responseHandler:${cb}&gid=${gid}`;
    document.head.appendChild(script);
  });
}

/* Converte a resposta gviz em rótulos + linhas de texto e normaliza. */
function parseGvizAnimais(resposta) {
  const tabela = resposta && resposta.table;
  if (!tabela || !tabela.rows) throw new Error("resposta gviz inesperada");
  const rotulos = tabela.cols.map((c) => c.label || "");
  const linhas = tabela.rows.map((linha) =>
    (linha.c || []).map((cel) => (cel && (cel.f ?? cel.v) != null ? String(cel.f ?? cel.v) : ""))
  );
  return normalizarLinhas(rotulos, linhas);
}

/* ============================================================
   Normalizador da planilha real ("Planilha de microchipagem")
   ------------------------------------------------------------
   Recebe o cabeçalho e as linhas (do CSV de exportação ou do
   gviz) e produz o modelo de animal usado pela vitrine:
   - Espécie: FELINO/CANINO/CANINA/DOG -> gato/cao
   - Sexo: FEMEA/MACHO -> femea/macho
   - Idade: número em anos; "MESES" = filhote; vazio = não informada
   - Comportamento e doença crônica viram a descrição do card
   - Sem colunas de foto/status -> placeholder por espécie e
     status "disponivel" para todos
   ============================================================ */

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function normalizarLinhas(cabecalho, linhas) {
  const idx = {};
  cabecalho.forEach((c, i) => { const r = semAcento(c); if (!(r in idx)) idx[r] = i; });
  const col = (alvo) => (alvo in idx) ? idx[alvo] : cabecalho.findIndex((c) => semAcento(c).startsWith(alvo));

  const iNome = col("nome"), iEsp = col("especie"), iSexo = col("sexo"),
        iIdade = col("idade"), iPorte = col("porte"), iCor = col("cor"),
        iComp = col("comportamento"), iCast = col("castracao"),
        iVac = col("vacinacao"), iDoe = col("doenca cronica");

  const valor = (linha, i) => (i >= 0 && linha[i] != null) ? String(linha[i]).trim() : "";

  const animais = [];
  linhas.forEach((linha, n) => {
    const nome = valor(linha, iNome);
    if (!nome || semAcento(nome) === "nome") return; // pula vazias/cabeçalho repetido

    const especieBruta = semAcento(valor(linha, iEsp));
    const especie = especieBruta.includes("fel") ? "gato"
      : (especieBruta.includes("can") || especieBruta.includes("dog")) ? "cao" : "";
    if (!especie) return; // linha sem espécie definida não entra na vitrine

    const sexoBruto = semAcento(valor(linha, iSexo));
    const sexo = sexoBruto.startsWith("fem") ? "femea" : sexoBruto.startsWith("mach") ? "macho" : "";

    let idadeMeses = null, idadeRotulo = null;
    const idadeBruta = semAcento(valor(linha, iIdade));
    if (/^\d+$/.test(idadeBruta)) idadeMeses = parseInt(idadeBruta, 10) * 12;
    else if (idadeBruta.includes("mes")) { idadeMeses = 6; idadeRotulo = "Filhote"; }

    const porteBruto = semAcento(valor(linha, iPorte));
    const porte = porteBruto.startsWith("peq") ? "pequeno"
      : porteBruto.startsWith("med") ? "medio"
      : porteBruto.startsWith("gra") ? "grande" : "";

    const compBruto = semAcento(valor(linha, iComp));
    const comportamento = compBruto.startsWith("doci") ? "Dócil"
      : compBruto.startsWith("brav") ? "Bravo(a)"
      : compBruto.startsWith("arisc") ? "Arisco(a)"
      : compBruto.startsWith("temper") ? "Temperamental" : null;

    const doencaBruta = valor(linha, iDoe);
    const temDoenca = doencaBruta && !/^(nao|não)$/i.test(doencaBruta) && doencaBruta.length > 1;

    const partes = [];
    if (comportamento) partes.push(comportamento === "Dócil" ? "Dócil e tranquilo(a)" : comportamento);
    if (temDoenca) partes.push("precisa de acompanhamento veterinário: " + doencaBruta);
    const descricao = partes.join(" — ") || "Em avaliação de temperamento pela nossa equipe.";

    const cor = valor(linha, iCor);

    animais.push({
      id: n + 1,
      nome: nome.toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase()),
      especie, sexo, porte,
      idadeMeses, idadeRotulo,
      castrado: semAcento(valor(linha, iCast)).startsWith("s"),
      vacinado: semAcento(valor(linha, iVac)).startsWith("s"),
      cor: cor || null,
      descricao,
      foto: `assets/img/animais/sem-foto-${especie}.svg`,
      status: "disponivel",
    });
  });

  if (!animais.length) throw new Error("nenhum animal válido encontrado na planilha");
  return animais;
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



/* ---------- Cards da vitrine ---------- */

/* Monta a linha "idade · porte · sexo" tolerando campos ausentes. */
function metaAnimal(a) {
  const partes = [];
  partes.push(a.idadeRotulo || idadeTexto(a.idadeMeses));
  if (a.porte) partes.push(rotulo(a.porte));
  if (a.sexo) partes.push(rotulo(a.sexo));
  return partes.filter(Boolean).join(" · ");
}

const capitalizar = (t) =>
  String(t).toLowerCase().replace(/(^|[\s(])\S/g, (c) => c.toUpperCase());

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
      <p class="meta">${metaAnimal(a)}</p>
      <p class="desc">${a.descricao}</p>
      <div class="marcas">
        ${a.castrado ? "<span>Castrado</span>" : ""}
        ${a.vacinado ? "<span>Vacinado</span>" : ""}
        ${a.cor ? `<span>${capitalizar(a.cor)}</span>` : ""}
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
  if (f.faixa !== "todos" && a.idadeMeses == null) return false; // idade desconhecida
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
