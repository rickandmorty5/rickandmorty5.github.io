async function fetchAllCharacters() {
  const first = await fetch(API);
  if (!first.ok) throw new Error("Could not connect to the Rick and Morty API.");
  const firstData = await first.json();

  const totalPages = firstData.info.pages;
  let all = [...firstData.results];

  // Fetch remaining pages smoothly in small sequence
  for (let p = 2; p <= totalPages; p++) {
    try {
      const res = await fetch(`${API}?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        all = all.concat(data.results);
      }
    } catch (e) {
      console.warn(`Failed fetching page ${p}, continuing...`);
    }
    
    const countEl = $("count");
    if (countEl) countEl.textContent = `Loading ${all.length.toLocaleString()} characters…`;
  }

  return all;
}
