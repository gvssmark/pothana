//https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1

const SHEET_URL = "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1";

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

async function loadFromIndexedDB() {
  try {
    const cachedRows = await getAllRows();

    if (cachedRows.length > 0) {
      data = cachedRows;
      const savedBookmark = parseInt(localStorage.getItem("bookmark"), 10);
      const startIndex = Number.isInteger(savedBookmark) ? savedBookmark : 0;
      showCard(startIndex);
      return true;
    }
  } catch (err) {
    console.error("IndexedDB load error:", err);
  }

  return false;
}

async function refreshFromServer() {
  try {
    const res = await fetch(SHEET_URL);
    const json = await res.json();
    const freshRows = mapRows(json);

    if (freshRows.length > 0) {
      data = freshRows;
      await saveRows(freshRows);

      const savedBookmark = parseInt(localStorage.getItem("bookmark"), 10);
      const startIndex = Number.isInteger(savedBookmark) ? savedBookmark : 0;
      showCard(startIndex);
    }
  } catch (err) {
    console.error("Server refresh failed:", err);
  }
}

window.addEventListener("load", async () => {
  initButtons();

  const hasCache = await loadFromIndexedDB();

  if (!hasCache) {
    document.getElementById("cardContainer").innerHTML = `
      <div class="card"><p>Loading...</p></div>
    `;
  }

  refreshFromServer();
});
