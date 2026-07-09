//https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1

async function fetchData() {
  const url = "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1";
  const res = await fetch(url);
  const json = await res.json(); // array of arrays

  // normalize
  data = json.slice(1).map((row, i) => ({
    id: i,
    skandhamu: row[1] || "",   // Column 2
    ghattamu: row[3] || "",    // Column 4
    pasam: row[6] || "",       // Column 7
    padyam: row[7] || "",      // Column 8
    teeka: row[8] || "",       // Column 9
    tippani: row[9] || ""      // Column 10
  }));

  await saveRows(data);
}

