//https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1

async function fetchData() {
  const url = "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1";
  const res = await fetch(url);
  const json = await res.json();

  // normalize
  data = json.map((row, i) => ({
    id: i,
    skandhamu: row[1],
    ghattamu: row[3],
    pasam: row[6],
    padyam: row[7],
    teeka: row[8],
    tippani: row[9]
  }));

  await saveRows(data);
}

async function init() {
  await fetchData();
  initSwipe();
  const bookmark = localStorage.getItem("bookmark");
  showCard(bookmark ? parseInt(bookmark) : 0);
}

init();
