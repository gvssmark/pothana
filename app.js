//https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1

async function fetchData() {
  const url = "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1azp8o_KQvmWNLPeiRK75JBY2Hu8DMY7wJYoWX_1WdWs&sheetname=Sheet1";

  try {
    const res = await fetch(url);
    const json = await res.json();

    data = json.slice(1).map((row, i) => ({
      id: i,
      skandhamu: row[1] || "",
      ghattamu: row[3] || "",
      pasam: row[6] || "",
      padyam: row[7] || "",
      teeka: row[8] || "",
      tippani: row[9] || ""
    }));

    console.log("Mapped first row:", data[0]);

    await saveRows(data);

    if (data.length > 0) {
      const savedBookmark = parseInt(localStorage.getItem("bookmark"), 10);
      const startIndex = Number.isInteger(savedBookmark) ? savedBookmark : 0;
      showCard(startIndex);
    } else {
      document.getElementById("cardContainer").innerHTML = "<p>No data found.</p>";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("cardContainer").innerHTML = "<p>Failed to load data.</p>";
  }
}

window.addEventListener("load", async () => {
  await fetchData();
  initSwipe();
});


