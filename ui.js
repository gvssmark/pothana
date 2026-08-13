let currentIndex = 0;
let data = [];
let isPreviewMode = false;
let starredItems = [];
let readAllMode = false;
let readAllList = [];
let readAllPos = 0;
let uiPrefs = {
  activeDetailTab: "meaning",
  fontScale: 1,
  theme: ""
};

const FONT_SCALE_MIN = 0.85;
const FONT_SCALE_MAX = 1.6;
const FONT_SCALE_STEP = 0.15;

function applyFontScale() {
  document.documentElement.style.setProperty("--font-scale", uiPrefs.fontScale);

  const label = document.getElementById("fontSizeLabel");
  if (label) label.textContent = `${Math.round(uiPrefs.fontScale * 100)}%`;

  const decBtn = document.getElementById("fontDecreaseBtn");
  const incBtn = document.getElementById("fontIncreaseBtn");
  if (decBtn) decBtn.disabled = uiPrefs.fontScale <= FONT_SCALE_MIN;
  if (incBtn) incBtn.disabled = uiPrefs.fontScale >= FONT_SCALE_MAX;

  updatePadyamScrollHint();
}

async function stepFontSize(delta) {
  const next = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, uiPrefs.fontScale + delta));
  uiPrefs.fontScale = Math.round(next * 100) / 100;
  applyFontScale();
  await saveMeta("uiPrefs", uiPrefs);
}

function applyTheme() {
  if (uiPrefs.theme) {
    document.documentElement.setAttribute("data-theme", uiPrefs.theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", uiPrefs.theme === "temple" ? "#eef5fb" : "#fdf6e3");

  document.querySelectorAll(".theme-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.themeValue === uiPrefs.theme);
  });
}

async function setTheme(value) {
  uiPrefs.theme = value;
  applyTheme();
  await saveMeta("uiPrefs", uiPrefs);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function positionKey(row) {
  return `${row.skandhamu}|||${row.ghattamu}|||${row.pasam}`;
}

// A "సీ" (seesa) verse never carries its own meaning/bhavam — those live on
// the very next row, which completes it. Such a row should never be shown
// on its own; it always merges into a single card with its companion.
function isSeeStarterRow(row) {
  return !!row && /సీ\.?\s*$/.test(row.pasam.trim()) && !row.teeka.trim() && !row.tippani.trim();
}

// Used for direct jumps (Home menu, search results, restoring a bookmark):
// if the target index is a సీ-starter, redirect forward to its companion.
function normalizeCardIndex(idx) {
  if (idx >= 0 && idx < data.length && isSeeStarterRow(data[idx])) {
    return idx + 1;
  }
  return idx;
}

// Used for Prev/Next: skip a సీ-starter in whichever direction we're paging,
// so it's never a separate stop either way.
function stepCardIndex(current, delta) {
  let target = current + delta;
  if (target >= 0 && target < data.length && isSeeStarterRow(data[target])) {
    target += delta;
  }
  return target;
}

function formatPadyam(str = "") {
  const lines = String(str).split(/\r\n|\r|\n/);
  return lines
    .map((line, i) => {
      const colorClass = i % 2 === 0 ? "line-red" : "line-blue";
      return `<span class="${colorClass}">${escapeHtml(line)}</span>`;
    })
    .join("<br>");
}

function renderCard(row) {
  const container = document.getElementById("cardContainer");

  if (!row) {
    container.innerHTML = `<div class="card"><div class="card-body"><p>No card found.</p></div></div>`;
    return;
  }

  const seeCompanion = data[currentIndex - 1];
  const isMerged = isSeeStarterRow(seeCompanion);

  const padyamHtml = isMerged
    ? `
      <p class="pasam-sublabel">${escapeHtml(seeCompanion.pasam)}</p>
      <p class="padyam">${formatPadyam(seeCompanion.padyam)}</p>
      <hr class="seesa-divider">
      <p class="pasam-sublabel">${escapeHtml(row.pasam)}</p>
      <p class="padyam">${formatPadyam(row.padyam)}</p>
    `
    : `<p class="padyam">${formatPadyam(row.padyam)}</p>`;

  const titlePasam = isMerged ? seeCompanion.pasam : row.pasam;

  updateHeaderContext(row, titlePasam);

  container.innerHTML = `
    <article class="card">
      ${isPreviewMode ? `
        <div class="card-head">
          <div class="preview-banner">
            <span>${readAllMode ? `ఆణిముత్యాలు (${readAllPos + 1}/${readAllList.length})` : "సెర్చ్ ఫలితం చూస్తున్నారు"}</span>
            <button id="backToPlaceBtn" class="back-to-place-btn">↩ Back to my place</button>
          </div>
        </div>
      ` : ""}
      <div id="padyamPane" class="padyam-pane">
        <button id="starBtn" class="star-btn" aria-label="Star this padyam">☆</button>
        ${padyamHtml}
        <div id="padyamScrollHint" class="padyam-scroll-hint hidden">⌄ మరింత చదవండి</div>
      </div>
      <div id="detailTabs" class="detail-tabs">
        <button class="detail-tab ${uiPrefs.activeDetailTab === "meaning" ? "active" : ""}" id="meaningTab" data-tab="meaning">పద్యార్థము</button>
        <button class="detail-tab ${uiPrefs.activeDetailTab === "bhavam" ? "active" : ""}" id="bhavamTab" data-tab="bhavam">భావము</button>
      </div>
      <div id="detailsPane" class="details-pane">
        <p class="meaning ${uiPrefs.activeDetailTab === "meaning" ? "" : "hidden"}" id="meaningContent">${escapeHtml(row.teeka)}</p>
        <p class="bhavam ${uiPrefs.activeDetailTab === "bhavam" ? "" : "hidden"}" id="bhavamContent">${escapeHtml(row.tippani)}</p>
      </div>
    </article>
  `;

  bindDetailTabs();
  bindBackToPlaceButton();
  bindDetailsSwipe();
  bindStarButton();
  scrollCardBodyToTop();
  updatePadyamScrollHint();
}

function updatePadyamScrollHint() {
  const pane = document.getElementById("padyamPane");
  const hint = document.getElementById("padyamScrollHint");
  if (!pane || !hint) return;
  const hasOverflow = pane.scrollHeight > pane.clientHeight + 2;
  hint.classList.toggle("hidden", !hasOverflow);
}

function updateHeaderContext(row, titlePasam) {
  const skandaEl = document.getElementById("headerSkanda");
  const ghattaPasamEl = document.getElementById("headerGhattaPasam");
  if (skandaEl) skandaEl.textContent = row.skandhamu;
  if (ghattaPasamEl) ghattaPasamEl.textContent = `${row.ghattamu} – ${titlePasam}`;
}

async function bindBackToPlaceButton() {
  const btn = document.getElementById("backToPlaceBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const savedPosition = await getMeta("readingPosition");
      const targetIndex = resolveReadingIndex(savedPosition, data);
      showCard(targetIndex, { persist: true });
    } catch (err) {
      console.error("Back to my place failed:", err);
    }
  });
}

function setActiveDetailTab(tab) {
  uiPrefs.activeDetailTab = tab;

  const meaningContent = document.getElementById("meaningContent");
  const bhavamContent = document.getElementById("bhavamContent");
  const meaningTab = document.getElementById("meaningTab");
  const bhavamTab = document.getElementById("bhavamTab");

  if (meaningContent) meaningContent.classList.toggle("hidden", tab !== "meaning");
  if (bhavamContent) bhavamContent.classList.toggle("hidden", tab !== "bhavam");
  if (meaningTab) meaningTab.classList.toggle("active", tab === "meaning");
  if (bhavamTab) bhavamTab.classList.toggle("active", tab === "bhavam");

  const pane = document.getElementById("detailsPane");
  if (pane) pane.scrollTo({ top: 0, behavior: "auto" });

  saveMeta("uiPrefs", uiPrefs).catch(err => console.error("Save active tab failed:", err));
}

function bindDetailTabs() {
  const meaningTab = document.getElementById("meaningTab");
  const bhavamTab = document.getElementById("bhavamTab");
  if (meaningTab) meaningTab.addEventListener("click", () => setActiveDetailTab("meaning"));
  if (bhavamTab) bhavamTab.addEventListener("click", () => setActiveDetailTab("bhavam"));
}

let detailsSwipeStartX = 0;
let detailsSwipeStartY = 0;

function bindDetailsSwipe() {
  const pane = document.getElementById("detailsPane");
  if (!pane) return;

  pane.addEventListener("touchstart", e => {
    if (!e.touches || !e.touches.length) return;
    detailsSwipeStartX = e.touches[0].clientX;
    detailsSwipeStartY = e.touches[0].clientY;
  }, { passive: true });

  pane.addEventListener("touchend", e => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - detailsSwipeStartX;
    const dy = e.changedTouches[0].clientY - detailsSwipeStartY;
    const SWIPE_MIN_DISTANCE = 50;

    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    setActiveDetailTab(dx < 0 ? "bhavam" : "meaning");
  }, { passive: true });
}

async function loadStarredItems() {
  try {
    const saved = await getMeta("starredItems");
    starredItems = Array.isArray(saved) ? saved : [];
  } catch (err) {
    console.error("Load starred items failed:", err);
    starredItems = [];
  }
}

function isCurrentCardStarred() {
  const row = data[currentIndex];
  if (!row) return false;
  const key = positionKey(row);
  return starredItems.some(item => item.key === key);
}

function updateStarButton() {
  const btn = document.getElementById("starBtn");
  if (!btn) return;
  const starred = isCurrentCardStarred();
  btn.textContent = starred ? "★" : "☆";
  btn.classList.toggle("starred", starred);
}

async function toggleStar() {
  const row = data[currentIndex];
  if (!row) return;

  const key = positionKey(row);
  const existingPos = starredItems.findIndex(item => item.key === key);

  if (existingPos !== -1) {
    starredItems.splice(existingPos, 1);
  } else {
    const seeCompanion = data[currentIndex - 1];
    const isMerged = isSeeStarterRow(seeCompanion);
    const snippetSource = isMerged ? seeCompanion.padyam : row.padyam;
    const pasamLabel = isMerged ? `${seeCompanion.pasam}, ${row.pasam}` : row.pasam;

    starredItems.push({
      index: currentIndex,
      key,
      skandhamu: row.skandhamu,
      ghattamu: row.ghattamu,
      pasam: pasamLabel,
      snippet: stripNewlines(snippetSource).slice(0, 80)
    });
  }

  await saveMeta("starredItems", starredItems);
  updateStarButton();
  if (!document.getElementById("gemsScreen").classList.contains("hidden")) {
    renderGemsList();
  }
}

function bindStarButton() {
  const btn = document.getElementById("starBtn");
  if (!btn) return;
  updateStarButton();
  btn.addEventListener("click", toggleStar);
}

function sortedStarredItems() {
  return [...starredItems].sort((a, b) => a.index - b.index);
}

function renderGemsList() {
  const container = document.getElementById("gemsResults");
  if (!container) return;

  if (!starredItems.length) {
    container.innerHTML = `<p class="search-hint">ఇంకా ఆణిముత్యాలు గుర్తించలేదు. పద్యం పేజీలో ☆ నొక్కి గుర్తించండి.</p>`;
    return;
  }

  const items = sortedStarredItems().map(item => `
    <div class="gem-row">
      <button class="search-result-item gem-nav-btn" data-index="${item.index}">
        <div class="search-result-head">${escapeHtml(item.skandhamu)} – ${escapeHtml(item.ghattamu)} – ${escapeHtml(item.pasam)}</div>
        <div class="search-result-snippet">${escapeHtml(item.snippet)}</div>
      </button>
      <button class="gem-delete-btn" data-key="${escapeHtml(item.key)}" aria-label="Delete">🗑</button>
    </div>
    <hr class="search-result-divider">
  `).join("");

  container.innerHTML = items;

  container.querySelectorAll(".gem-nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      exitReadAllMode();
      const index = parseInt(btn.dataset.index, 10);
      showCard(index, { persist: false });
      closeGems();
    });
  });

  container.querySelectorAll(".gem-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key;
      starredItems = starredItems.filter(item => item.key !== key);
      await saveMeta("starredItems", starredItems);
      updateStarButton();
      if (!starredItems.length) {
        closeGems();
      } else {
        renderGemsList();
      }
    });
  });
}

async function clearAllGems() {
  if (!starredItems.length) return;
  if (!confirm("అన్ని ఆణిముత్యాలు తొలగించాలా?")) return;
  starredItems = [];
  await saveMeta("starredItems", starredItems);
  updateStarButton();
  closeGems();
}

function openGems() {
  document.getElementById("gemsOverlay").classList.remove("hidden");
  document.getElementById("gemsScreen").classList.remove("hidden");
  document.getElementById("gemsScreen").setAttribute("aria-hidden", "false");
  renderGemsList();
}

function closeGems() {
  document.getElementById("gemsOverlay").classList.add("hidden");
  document.getElementById("gemsScreen").classList.add("hidden");
  document.getElementById("gemsScreen").setAttribute("aria-hidden", "true");
}

function exitReadAllMode() {
  readAllMode = false;
  readAllList = [];
  readAllPos = 0;
}

function startReadAllGems() {
  if (!starredItems.length) return;
  readAllList = sortedStarredItems();
  readAllPos = 0;
  readAllMode = true;
  showCard(readAllList[0].index, { persist: false });
  closeGems();
}

function stepReadAll(delta) {
  if (!readAllList.length) return;
  readAllPos = (readAllPos + delta + readAllList.length) % readAllList.length;
  showCard(readAllList[readAllPos].index, { persist: false });
}

function buildShareText(row) {
  const seeCompanion = data[currentIndex - 1];
  const isMerged = isSeeStarterRow(seeCompanion);

  const padyamText = isMerged
    ? `${seeCompanion.pasam}\n${seeCompanion.padyam}\n\n${row.pasam}\n${row.padyam}`
    : `${row.pasam}\n${row.padyam}`;

  return [
    `${row.skandhamu} – ${row.ghattamu}`,
    "",
    padyamText,
    "",
    "పద్యార్థము:",
    row.teeka,
    "",
    "భావము:",
    row.tippani
  ].join("\n");
}

async function shareCurrentCardToWhatsApp() {
  const row = data[currentIndex];
  if (!row) return;

  const message = buildShareText(row);

  try {
    await navigator.clipboard.writeText(message);
  } catch (err) {
    // Clipboard access blocked — not fatal, WhatsApp still opens with the
    // text pre-filled via the URL itself.
  }

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}



function scrollCardBodyToTop() {
  const padyamPane = document.getElementById("padyamPane");
  const detailsPane = document.getElementById("detailsPane");
  if (padyamPane) padyamPane.scrollTo({ top: 0, behavior: "auto" });
  if (detailsPane) detailsPane.scrollTo({ top: 0, behavior: "auto" });
}

function showCard(index, options = {}) {
  const persist = options.persist !== false;
  const targetIndex = normalizeCardIndex(index);

  if (targetIndex >= 0 && targetIndex < data.length) {
    currentIndex = targetIndex;
    isPreviewMode = !persist;

    if (persist) {
      exitReadAllMode();
    }

    const row = data[targetIndex];
    renderCard(row);
    updateNavButtons();

    if (persist) {
      saveMeta("readingPosition", {
        index: targetIndex,
        key: positionKey(row)
      });
    }
  }
}

function updateNavButtons() {
  if (readAllMode) {
    document.getElementById("prevBtn").disabled = readAllList.length === 0;
    document.getElementById("nextBtn").disabled = readAllList.length === 0;
    return;
  }
  document.getElementById("prevBtn").disabled = currentIndex <= 0;
  document.getElementById("nextBtn").disabled = currentIndex >= data.length - 1;
}

function buildHomeTree() {
  const homeTree = document.getElementById("homeTree");
  if (!homeTree) return;

  const grouped = {};
  data.forEach((row, index) => {
    const sk = row.skandhamu || "Unknown Skandha";
    const gh = row.ghattamu || "Unknown Ghatta";
    if (!grouped[sk]) grouped[sk] = {};
    if (grouped[sk][gh] === undefined) grouped[sk][gh] = index;
  });

  const html = Object.keys(grouped).map(sk => {
    const ghattas = Object.keys(grouped[sk]).map(gh => `
      <button class="ghatta-btn" data-index="${grouped[sk][gh]}">${escapeHtml(gh)}</button>
    `).join("");

    return `
      <details class="skandha-block">
        <summary>${escapeHtml(sk)}</summary>
        <div class="ghatta-list">${ghattas}</div>
      </details>
    `;
  }).join("");

  homeTree.innerHTML = html;

  homeTree.querySelectorAll(".ghatta-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index, 10);
      showCard(index);
      closeMenu();
    });
  });
}

function openMenu() {
  document.getElementById("sidePanel").classList.remove("hidden");
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("sidePanel").setAttribute("aria-hidden", "false");
}

function closeMenu() {
  document.getElementById("sidePanel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("sidePanel").setAttribute("aria-hidden", "true");
}

function showAbout() {
  document.getElementById("aboutScreen").classList.remove("hidden");
}

function closeAbout() {
  document.getElementById("aboutScreen").classList.add("hidden");
}

const MIN_SEARCH_CHARS = 3;
const SEARCH_RESULT_CAP = 200;

let searchState = {
  query: "",
  scope: "all",
  results: []
};
let searchDebounceTimer = null;

function stripNewlines(str = "") {
  return String(str).replace(/\r\n|\r|\n/g, " ");
}

function getGraphemeSegmenter() {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    if (!getGraphemeSegmenter._instance) {
      getGraphemeSegmenter._instance = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    }
    return getGraphemeSegmenter._instance;
  }
  return null;
}

// Returns the code-unit offsets where each grapheme cluster starts (plus the
// string length as a final boundary), or null if Intl.Segmenter isn't available.
function graphemeBoundaries(str) {
  const segmenter = getGraphemeSegmenter();
  if (!segmenter) return null;

  const boundaries = [];
  for (const s of segmenter.segment(str)) boundaries.push(s.index);
  boundaries.push(str.length);
  return boundaries;
}

// Snaps a raw code-unit position to the nearest complete grapheme boundary,
// so we never cut a base consonant apart from its combining vowel sign.
function snapToBoundary(boundaries, pos, direction) {
  if (!boundaries) return pos; // no Intl.Segmenter support: fall back to raw position

  if (direction === "down") {
    let result = 0;
    for (const b of boundaries) {
      if (b <= pos) result = b; else break;
    }
    return result;
  }

  for (const b of boundaries) {
    if (b >= pos) return b;
  }
  return boundaries[boundaries.length - 1];
}

function buildSnippet(text, query, radius = 60) {
  const clean = stripNewlines(text).trim();
  const idx = clean.toLowerCase().indexOf(query.toLowerCase());

  if (idx === -1) {
    const boundaries = graphemeBoundaries(clean.slice(0, radius * 2 + 20));
    const cutAt = snapToBoundary(boundaries, radius * 2, "down");
    const short = clean.slice(0, cutAt);
    return escapeHtml(short) + (clean.length > cutAt ? "…" : "");
  }

  // Segment only a local window around the match, not the whole field —
  // keeps this fast even for long meaning/bhavam paragraphs.
  const windowStart = Math.max(0, idx - radius - 10);
  const windowEnd = Math.min(clean.length, idx + query.length + radius + 10);
  const windowStr = clean.slice(windowStart, windowEnd);
  const boundaries = graphemeBoundaries(windowStr);

  const localIdx = idx - windowStart;
  const localMatchEnd = localIdx + query.length;

  const matchStart = snapToBoundary(boundaries, localIdx, "down");
  const matchEnd = snapToBoundary(boundaries, localMatchEnd, "up");
  const start = snapToBoundary(boundaries, Math.max(0, localIdx - radius), "down");
  const end = snapToBoundary(boundaries, Math.min(windowStr.length, localMatchEnd + radius), "up");

  const before = windowStr.slice(start, matchStart);
  const match = windowStr.slice(matchStart, matchEnd);
  const after = windowStr.slice(matchEnd, end);

  const prefix = (windowStart + start) > 0 ? "…" : "";
  const suffix = (windowStart + end) < clean.length ? "…" : "";

  return prefix + escapeHtml(before) + `<mark>${escapeHtml(match)}</mark>` + escapeHtml(after) + suffix;
}

function persistSearchMeta() {
  saveMeta("lastSearch", { query: searchState.query, scope: searchState.scope })
    .catch(err => console.error("Save search meta failed:", err));
}

function runSearch(query, scope) {
  searchState.query = query;
  searchState.scope = scope;
  persistSearchMeta();

  const q = query.trim();
  if (q.length < MIN_SEARCH_CHARS) {
    searchState.results = [];
    renderSearchResults();
    return;
  }

  const fields = scope === "all" ? ["padyam", "teeka", "tippani"] : [scope];
  const qLower = q.toLowerCase();
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (const field of fields) {
      const text = row[field] || "";
      if (text.toLowerCase().includes(qLower)) {
        results.push({ index: i, row, snippet: buildSnippet(text, q) });
        break;
      }
    }
    if (results.length >= SEARCH_RESULT_CAP) break;
  }

  searchState.results = results;
  renderSearchResults();
}

function renderSearchResults() {
  const container = document.getElementById("searchResults");
  if (!container) return;

  const q = searchState.query.trim();

  if (!q) {
    container.innerHTML = `<p class="search-hint">వెతకడానికి కనీసం ${MIN_SEARCH_CHARS} అక్షరాలు టైప్ చేయండి.</p>`;
    return;
  }

  if (q.length < MIN_SEARCH_CHARS) {
    container.innerHTML = `<p class="search-hint">మరిన్ని అక్షరాలు టైప్ చేయండి... (కనీసం ${MIN_SEARCH_CHARS})</p>`;
    return;
  }

  if (!searchState.results.length) {
    container.innerHTML = `<p class="search-hint">ఫలితాలు కనబడలేదు.</p>`;
    return;
  }

  const items = searchState.results.map(r => `
    <button class="search-result-item" data-index="${r.index}">
      <div class="search-result-head">${escapeHtml(r.row.skandhamu)} – ${escapeHtml(r.row.ghattamu)} – ${escapeHtml(r.row.pasam)}</div>
      <div class="search-result-snippet">${r.snippet}</div>
    </button>
    <hr class="search-result-divider">
  `).join("");

  const capNote = searchState.results.length >= SEARCH_RESULT_CAP
    ? `<p class="search-hint">తొలి ${SEARCH_RESULT_CAP} ఫలితాలు చూపిస్తున్నాం. మరింత నిర్దిష్టంగా వెతకండి.</p>`
    : "";

  container.innerHTML = items + capNote;

  container.querySelectorAll(".search-result-item").forEach(btn => {
    btn.addEventListener("click", () => {
      exitReadAllMode();
      const index = parseInt(btn.dataset.index, 10);
      showCard(index, { persist: false });
      closeSearch();
    });
  });
}

function onSearchInput(e) {
  const query = e.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    runSearch(query, searchState.scope);
  }, 150);
}

function bindSearchScopeChips() {
  document.querySelectorAll(".scope-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".scope-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      runSearch(searchState.query, chip.dataset.scope);
    });
  });
}

async function restoreSearchState() {
  try {
    const saved = await getMeta("lastSearch");
    if (!saved || !saved.query) return;

    searchState.scope = saved.scope || "all";
    document.querySelectorAll(".scope-chip").forEach(chip => {
      chip.classList.toggle("active", chip.dataset.scope === searchState.scope);
    });

    const input = document.getElementById("searchInput");
    if (input) input.value = saved.query;

    runSearch(saved.query, searchState.scope);
  } catch (err) {
    console.error("Restore search state failed:", err);
  }
}

function openSearch() {
  document.getElementById("searchOverlay").classList.remove("hidden");
  document.getElementById("searchScreen").classList.remove("hidden");
  document.getElementById("searchScreen").setAttribute("aria-hidden", "false");

  const input = document.getElementById("searchInput");
  if (input && input.value !== searchState.query) {
    input.value = searchState.query;
  }
  renderSearchResults();
  if (input) setTimeout(() => input.focus(), 50);
}

function closeSearch() {
  document.getElementById("searchOverlay").classList.add("hidden");
  document.getElementById("searchScreen").classList.add("hidden");
  document.getElementById("searchScreen").setAttribute("aria-hidden", "true");
}

function clearSearch() {
  searchState = { query: "", scope: "all", results: [] };

  const input = document.getElementById("searchInput");
  if (input) input.value = "";

  document.querySelectorAll(".scope-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.scope === "all");
  });

  persistSearchMeta();
  renderSearchResults();
}

async function checkSearchAnnouncement() {
  try {
    const seen = await getMeta("searchAnnouncementSeen");
    const el = document.getElementById("searchAnnouncement");
    if (el) el.classList.toggle("hidden", !!seen);
  } catch (err) {
    console.error("Check announcement failed:", err);
  }
}

function hideSplash() {
  document.getElementById("splashScreen").classList.add("hidden");
  saveMeta("searchAnnouncementSeen", true).catch(err => console.error("Save announcement flag failed:", err));
}

function showStatus(message) {
  let status = document.getElementById("statusToast");
  if (!status) {
    status = document.createElement("div");
    status.id = "statusToast";
    status.className = "status-toast";
    document.body.appendChild(status);
  }
  status.textContent = message;
  status.classList.add("show");
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => status.classList.remove("show"), 2200);
}

function initUIEvents(refreshHandler) {
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (readAllMode) { stepReadAll(-1); return; }
    showCard(stepCardIndex(currentIndex, -1), { persist: !isPreviewMode });
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (readAllMode) { stepReadAll(1); return; }
    showCard(stepCardIndex(currentIndex, 1), { persist: !isPreviewMode });
  });
  document.getElementById("homeBtn").addEventListener("click", openMenu);
  document.getElementById("menuBtn").addEventListener("click", openMenu);
  document.getElementById("closeMenuBtn").addEventListener("click", closeMenu);
  document.getElementById("overlay").addEventListener("click", closeMenu);
  document.getElementById("aboutBtn").addEventListener("click", () => {
    closeMenu();
    showAbout();
  });
  document.getElementById("closeAboutBtn").addEventListener("click", closeAbout);
  document.getElementById("startBtn").addEventListener("click", hideSplash);
  document.getElementById("searchBtn").addEventListener("click", openSearch);
  document.getElementById("closeSearchBtn").addEventListener("click", closeSearch);
  document.getElementById("searchOverlay").addEventListener("click", closeSearch);
  document.getElementById("clearSearchBtn").addEventListener("click", clearSearch);
  document.getElementById("searchInput").addEventListener("input", onSearchInput);
  bindSearchScopeChips();
  document.getElementById("fontDecreaseBtn").addEventListener("click", () => stepFontSize(-FONT_SCALE_STEP));
  document.getElementById("fontIncreaseBtn").addEventListener("click", () => stepFontSize(FONT_SCALE_STEP));
  document.querySelectorAll(".theme-chip").forEach(chip => {
    chip.addEventListener("click", () => setTheme(chip.dataset.themeValue));
  });
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    closeMenu();
    await refreshHandler(true);
  });
  document.getElementById("gemsBtn").addEventListener("click", () => {
    closeMenu();
    openGems();
  });
  document.getElementById("closeGemsBtn").addEventListener("click", closeGems);
  document.getElementById("gemsOverlay").addEventListener("click", closeGems);
  document.getElementById("readAllGemsBtn").addEventListener("click", startReadAllGems);
  document.getElementById("clearGemsBtn").addEventListener("click", clearAllGems);
  document.getElementById("whatsappBtn").addEventListener("click", () => {
    closeMenu();
    shareCurrentCardToWhatsApp();
  });
}
