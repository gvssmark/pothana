const SHEET_URL = "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1";

// TODO: replace with your deployed usage-log Web App URL (ends in /exec)
const USAGE_LOG_URL = "PASTE_YOUR_USAGE_LOG_EXEC_URL_HERE";

async function getOrCreateDeviceId() {
  let deviceId = await getMeta("deviceId");
  if (!deviceId) {
    deviceId = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await saveMeta("deviceId", deviceId);
  }
  return deviceId;
}

function detectStandalone() {
  const isDisplayModeStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = window.navigator && window.navigator.standalone === true;
  return (isDisplayModeStandalone || isIosStandalone) ? "yes" : "no";
}

function detectPlatform() {
  return (navigator.userAgent || "unknown").slice(0, 150);
}

async function logUsage() {
  if (!USAGE_LOG_URL || USAGE_LOG_URL.indexOf("PASTE_") === 0) return; // not configured yet

  try {
    const deviceId = await getOrCreateDeviceId();
    const params = new URLSearchParams({
      deviceId,
      platform: detectPlatform(),
      standalone: detectStandalone()
    });
    // no-cors: fire-and-forget, we don't need to read the response,
    // and Apps Script doesn't return CORS headers for simple GETs like this.
    await fetch(`${USAGE_LOG_URL}?${params.toString()}`, { mode: "no-cors" });
  } catch (err) {
    // Silently ignore — usage logging should never block or break the app,
    // e.g. when offline.
    console.error("Usage log failed (non-critical):", err);
  }
}

function mapRows(json) {
  return json.slice(1).map((row, i) => ({
    id: i,
    skandhamu: row[1] || "",
    ghattamu: row[3] || "",
    pasam: row[6] || "",
    padyam: row[7] || "",
    teeka: row[8] || "",
    tippani: row[9] || ""
  }));
}

function dataSignature(rows) {
  return JSON.stringify(rows.map(r => [r.skandhamu, r.ghattamu, r.pasam, r.padyam, r.teeka, r.tippani]));
}

function resolveReadingIndex(savedPosition, rows) {
  if (!savedPosition || !rows.length) return 0;
  if (savedPosition.key) {
    const idx = rows.findIndex(r => positionKey(r) === savedPosition.key);
    if (idx !== -1) return idx;
  }
  if (typeof savedPosition.index === "number" && savedPosition.index >= 0 && savedPosition.index < rows.length) {
    return savedPosition.index;
  }
  return 0;
}

async function loadPrefs() {
  const savedPrefs = await getMeta("uiPrefs");
  if (savedPrefs) {
    uiPrefs = {
      meaningExpanded: savedPrefs.meaningExpanded !== false,
      bhavamExpanded: savedPrefs.bhavamExpanded !== false,
      fontScale: typeof savedPrefs.fontScale === "number" ? savedPrefs.fontScale : 1,
      theme: savedPrefs.theme === "temple" ? "temple" : ""
    };
  }
  applyFontScale();
  applyTheme();
}

async function loadFromIndexedDB() {
  const cachedRows = await getAllRows();
  if (!cachedRows.length) return false;

  data = cachedRows;
  buildHomeTree();
  const savedPosition = await getMeta("readingPosition");
  const startIndex = resolveReadingIndex(savedPosition, data);
  showCard(startIndex);
  return true;
}

async function refreshFromServer(manual = false) {
  try {
    const res = await fetch(SHEET_URL);
    const json = await res.json();
    const freshRows = mapRows(json);
    if (!freshRows.length) return;

    const oldSig = dataSignature(data);
    const newSig = dataSignature(freshRows);
    const savedPosition = await getMeta("readingPosition");

    data = freshRows;
    await replaceRows(freshRows);
    buildHomeTree();

    const startIndex = resolveReadingIndex(savedPosition, data);
    showCard(startIndex);

    if (oldSig && oldSig !== newSig) {
      showStatus("Content refreshed from source");
    } else if (manual) {
      showStatus("Already up to date");
    }
  } catch (err) {
    console.error("Refresh failed:", err);
    if (manual) showStatus("Refresh failed");
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(err => console.error("SW registration failed:", err));
  }
}

async function loadFromBundledData() {
  if (typeof LOCAL_DATA === "undefined" || !LOCAL_DATA.length) return false;

  const rows = mapRows(LOCAL_DATA);
  if (!rows.length) return false;

  data = rows;
  await replaceRows(rows);
  buildHomeTree();

  const savedPosition = await getMeta("readingPosition");
  const startIndex = resolveReadingIndex(savedPosition, data);
  showCard(startIndex);
  return true;
}

window.addEventListener("load", async () => {
  initUIEvents(refreshFromServer);
  await loadPrefs();
  await checkSearchAnnouncement();

  let hasCache = false;
  try {
    hasCache = await loadFromIndexedDB();
  } catch (err) {
    console.error("IndexedDB load error:", err);
  }

  if (!hasCache) {
    try {
      hasCache = await loadFromBundledData();
    } catch (err) {
      console.error("Bundled data load error:", err);
    }
  }

  if (!hasCache) {
    document.getElementById("cardContainer").innerHTML = `
      <article class="card">
        <div class="card-head"><h4>Loading</h4></div>
        <div class="card-body"><p>Loading content...</p></div>
      </article>
    `;
  }

  await restoreSearchState();

 // await refreshFromServer(false);
  registerServiceWorker();
  logUsage(); // fire-and-forget, never blocks the UI
});
