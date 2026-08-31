const API = "https://rickandmortyapi.com/api/character";

const state = {
  page: 1,
  pages: 1,
  search: "",
  status: "",
  species: "",
  pageSize: 20
};

const $ = id => document.getElementById(id);
const grid = $("grid");
const errorBox = $("error");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function skeletons() {
  grid.innerHTML = Array.from({length: state.pageSize}, () => '<div class="skeleton"></div>').join("");
}

function statusClass(status) {
  return String(status || "unknown").toLowerCase();
}

function renderCards(items) {
  if (!items.length) {
    grid.innerHTML = `<div class="error" style="grid-column:1/-1">No characters matched those filters.</div>`;
    return;
  }

  grid.innerHTML = items.map((c, i) => `
    <article class="card" data-id="${c.id}" style="animation-delay:${Math.min(i * 0.025, .35)}s">
      <div class="card-img">
        <img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">
        <div class="badge ${statusClass(c.status)}"><i></i>${esc(c.status)}</div>
      </div>
      <div class="card-body">
        <h3>${esc(c.name)}</h3>
        <div class="meta">
          <span class="species">${esc(c.species)}</span>
          <span>${esc(c.gender)}</span>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(items.find(x => String(x.id) === card.dataset.id)));
  });
}

function renderPagination() {
  $("pageCount").textContent = `${state.page} / ${state.pages}`;
  $("prevBtn").disabled = state.page <= 1;
  $("nextBtn").disabled = state.page >= state.pages;

  const wrap = $("pageNumbers");
  const pages = [];
  const start = Math.max(1, state.page - 2);
  const end = Math.min(state.pages, start + 4);
  for (let p = start; p <= end; p++) {
    pages.push(`<button class="${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`);
  }
  wrap.innerHTML = pages.join("");
  wrap.querySelectorAll("button").forEach(b => b.onclick = () => {
    state.page = Number(b.dataset.page);
    load();
  });
}

async function load() {
  errorBox.hidden = true;
  skeletons();

  const params = new URLSearchParams({ page: state.page });
  if (state.search) params.set("name", state.search);
  if (state.status) params.set("status", state.status);
  if (state.species) params.set("species", state.species);

  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error("No matching characters found.");
    const data = await res.json();

    state.pages = data.info.pages;
    $("resultCount").textContent = data.info.count.toLocaleString();
    renderCards(data.results.slice(0, state.pageSize));
    renderPagination();
  } catch (err) {
    state.pages = 1;
    $("resultCount").textContent = "0";
    $("pageCount").textContent = "1 / 1";
    $("prevBtn").disabled = true;
    $("nextBtn").disabled = true;
    grid.innerHTML = "";
    errorBox.textContent = err.message || "Something went wrong.";
    errorBox.hidden = false;
  }
}

function openModal(c) {
  if (!c) return;
  $("modalImage").src = c.image;
  $("modalImage").alt = c.name;
  $("modalName").textContent = c.name;
  $("modalSpecies").textContent = c.species;
  $("modalGender").textContent = c.gender;
  $("modalOrigin").textContent = c.origin?.name || "Unknown";
  $("modalLocation").textContent = c.location?.name || "Unknown";
  const badge = $("modalStatus");
  badge.className = `badge ${statusClass(c.status)}`;
  badge.innerHTML = `<i></i>${c.status}`;
  $("modal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("modal").hidden = true;
  document.body.style.overflow = "";
}

let timer;
$("searchInput").addEventListener("input", e => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    load();
  }, 300);
});

$("statusFilter").onchange = e => { state.status = e.target.value; state.page = 1; load(); };
$("speciesFilter").onchange = e => { state.species = e.target.value; state.page = 1; load(); };
$("pageSize").onchange = e => { state.pageSize = Number(e.target.value); state.page = 1; load(); };
$("prevBtn").onclick = () => { if (state.page > 1) { state.page--; load(); } };
$("nextBtn").onclick = () => { if (state.page < state.pages) { state.page++; load(); } };
$("closeModal").onclick = closeModal;
$("modal").querySelector(".modal-backdrop").onclick = closeModal;
document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault(); $("searchInput").focus();
  }
  if (e.key === "Escape") closeModal();
});

load();
