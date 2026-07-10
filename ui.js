let currentIndex = 0;
let data = [];
let uiPrefs = {
  meaningExpanded: true,
  bhavamExpanded: true
};

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

  container.innerHTML = `
    <article class="card">
      <div class="card-head">
        <h4>${escapeHtml(row.skandhamu)} – ${escapeHtml(row.ghattamu)} – ${escapeHtml(row.pasam)}</h4>
      </div>
      <div id="cardBody" class="card-body">
        <p class="padyam">${formatPadyam(row.padyam)}</p>

        <section class="toggle-block">
          <button class="toggle-btn" id="meaningToggle" aria-expanded="${uiPrefs.meaningExpanded}">
            పద్యార్థము ${uiPrefs.meaningExpanded ? "−" : "+"}
          </button>
          <div class="meaning-wrap ${uiPrefs.meaningExpanded ? "" : "collapsed"}" id="meaningWrap">
            <p class="meaning">${escapeHtml(row.teeka)}</p>
          </div>
        </section>

        <section class="toggle-block">
          <button class="toggle-btn" id="bhavamToggle" aria-expanded="${uiPrefs.bhavamExpanded}">
            భావము ${uiPrefs.bhavamExpanded ? "−" : "+"}
          </button>
          <div class="bhavam-wrap ${uiPrefs.bhavamExpanded ? "" : "collapsed"}" id="bhavamWrap">
            <p class="bhavam">${escapeHtml(row.tippani)}</p>
          </div>
        </section>
      </div>
    </article>
  `;

  bindCardToggles();
  scrollCardBodyToTop();
}

function bindCardToggles() {
  const meaningToggle = document.getElementById("meaningToggle");
  const bhavamToggle = document.getElementById("bhavamToggle");
  const meaningWrap = document.getElementById("meaningWrap");
  const bhavamWrap = document.getElementById("bhavamWrap");

  if (meaningToggle && meaningWrap) {
    meaningToggle.addEventListener("click", async () => {
      uiPrefs.meaningExpanded = !uiPrefs.meaningExpanded;
      meaningWrap.classList.toggle("collapsed", !uiPrefs.meaningExpanded);
      meaningToggle.setAttribute("aria-expanded", String(uiPrefs.meaningExpanded));
      meaningToggle.textContent = `పద్యార్థము ${uiPrefs.meaningExpanded ? "−" : "+"}`;
      await saveMeta("uiPrefs", uiPrefs);
    });
  }

  if (bhavamToggle && bhavamWrap) {
    bhavamToggle.addEventListener("click", async () => {
      uiPrefs.bhavamExpanded = !uiPrefs.bhavamExpanded;
      bhavamWrap.classList.toggle("collapsed", !uiPrefs.bhavamExpanded);
      bhavamToggle.setAttribute("aria-expanded", String(uiPrefs.bhavamExpanded));
      bhavamToggle.textContent = `భావము ${uiPrefs.bhavamExpanded ? "−" : "+"}`;
      await saveMeta("uiPrefs", uiPrefs);
    });
  }
}

function scrollCardBodyToTop() {
  const body = document.getElementById("cardBody");
  if (body) {
    body.scrollTo({ top: 0, behavior: "auto" });
  }
}

function showCard(index) {
  if (index >= 0 && index < data.length) {
    currentIndex = index;
    const row = data[index];
    renderCard(row);
    updateNavButtons();
    saveMeta("readingPosition", {
      index,
      key: positionKey(row)
    });
  }
}

function updateNavButtons() {
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

function hideSplash() {
  document.getElementById("splashScreen").classList.add("hidden");
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
  document.getElementById("prevBtn").addEventListener("click", () => showCard(currentIndex - 1));
  document.getElementById("nextBtn").addEventListener("click", () => showCard(currentIndex + 1));
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
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    closeMenu();
    await refreshHandler(true);
  });
}
