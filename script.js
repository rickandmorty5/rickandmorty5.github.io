const API = "https://rickandmortyapi.com/api/character";

const state = {
  all: [],
  filtered: [],
  page: 1,
  pageSize: 20,
  search: "",
  status: "",
  species: "",
  loading: true
};

const $ = id => document.getElementById(id);
const grid = $("grid");
const errorBox = $("error");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function statusClass(status) {
  return String(status || "unknown").toLowerCase();
}

function skeletons(count = 12) {
  grid.innerHTML = Array.from({length: count}, () =>
    '<div class="skeleton"></div>'
  ).join("");
}

async function fetchAllCharacters() {
  const first = await fetch(API);
  if (!first.ok) throw new Error("Could not connect to the Rick and Morty API.");
  const firstData = await first.json();

  const totalPages = firstData.info.pages;
  const all = [...firstData.results];

  // Fetch the remaining API pages in batches so the browser isn't flooded.
  for (let start = 2; start <= totalPages; start += 6) {
    const batch = [];
    for (let p = start; p < Math.min(start + 6, totalPages + 1); p++) {
      batch.push(fetch(`${API}?page=${p}`).then(r => {
        if (!r.ok) throw new Error(`Failed to load API page ${p}.`);
        return r.json();
      }));
    }
    const results = await Promise.all(batch);
    results.forEach(data => all.push(...data.results));
    $("count").textContent = `Loading ${all.length.toLocaleString()} characters…`;
  }

  return all;
}

function applyFilters() {
  const q = state.search.toLowerCase();

  state.filtered = state.all.filter(c => {
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.species.toLowerCase().includes(q) ||
      c.gender.toLowerCase().includes(q) ||
      (c.origin?.name || "").toLowerCase().includes(q) ||
      (c.location?.name || "").toLowerCase().includes(q);

    const matchesStatus =
      !state.status || statusClass(c.status) === state.status;

    const matchesSpecies =
      !state.species || c.species === state.species;

    return matchesSearch && matchesStatus && matchesSpecies;
  });

  const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.min(state.page, maxPage);

  render();
}

function render() {
  errorBox.hidden = true;

  const start = (state.page - 1) * state.pageSize;
  const items = state.filtered.slice(start, start + state.pageSize);

  $("resultCount").textContent = state.filtered.length.toLocaleString();
  const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  $("pageCount").textContent = `${state.page} / ${pages}`;

  if (!items.length) {
    grid.innerHTML =
      `<div class="error" style="grid-column:1/-1">No characters matched those filters.</div>`;
  } else {
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
      card.addEventListener("click", () => {
        const character = state.all.find(x => String(x.id) === card.dataset.id);
        openModal(character);
      });
    });
  }

  $("prevBtn").disabled = state.page <= 1;
  $("nextBtn").disabled = state.page >= pages;

  const wrap = $("pageNumbers");
  const pageButtons = [];
  const windowSize = 5;
  let startPage = Math.max(1, state.page - 2);
  let endPage = Math.min(pages, startPage + windowSize - 1);
  startPage = Math.max(1, endPage - windowSize + 1);

  for (let p = startPage; p <= endPage; p++) {
    pageButtons.push(
      `<button class="${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`
    );
  }
  wrap.innerHTML = pageButtons.join("");
  wrap.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      state.page = Number(b.dataset.page);
      render();
      window.scrollTo({top: 0, behavior: "smooth"});
    };
  });
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

$("searchInput").addEventListener("input", e => {
  state.search = e.target.value.trim();
  state.page = 1;
  applyFilters();
});

$("statusFilter").onchange = e => {
  state.status = e.target.value;
  state.page = 1;
  applyFilters();
};

$("speciesFilter").onchange = e => {
  state.species = e.target.value;
  state.page = 1;
  applyFilters();
};

$("pageSize").onchange = e => {
  state.pageSize = Number(e.target.value);
  state.page = 1;
  render();
};

$("prevBtn").onclick = () => {
  if (state.page > 1) {
    state.page--;
    render();
    window.scrollTo({top: 0, behavior: "smooth"});
  }
};

$("nextBtn").onclick = () => {
  const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  if (state.page < pages) {
    state.page++;
    render();
    window.scrollTo({top: 0, behavior: "smooth"});
  }
};

$("closeModal").onclick = closeModal;
$("modal").querySelector(".modal-backdrop").onclick = closeModal;

document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    $("searchInput").focus();
  }
  if (e.key === "Escape") closeModal();
});

(async () => {
  try {
    skeletons(12);
    state.all = await fetchAllCharacters();
    state.loading = false;
    state.filtered = [...state.all];
    $("count").textContent = `${state.all.length.toLocaleString()} characters loaded`;
    $("resultCount").textContent = state.all.length.toLocaleString();
    render();
  } catch (err) {
    state.loading = false;
    grid.innerHTML = "";
    errorBox.textContent = err.message || "Something went wrong.";
    errorBox.hidden = false;
    $("count").textContent = "API unavailable";
    $("resultCount").textContent = "0";
  }
})();
