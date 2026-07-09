function renderCard(row) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = `
    <div class="card">
      <h2>${row.skandhamu} – ${row.ghattamu} – ${row.pasam}</h2>
      <div class="card-body">
        <p class="padyam">${row.padyam}</p>
        <p class="meaning">${row.teeka}</p>
        <p class="bhavam">${row.tippani}</p>
      </div>
    </div>
  `;
}
