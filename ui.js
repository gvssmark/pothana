let currentIndex = 0;
let data = [];

function renderCard(row) {
  const container = document.getElementById("cardContainer");

  if (!row) {
    container.innerHTML = `<div class="card"><p>No card found.</p></div>`;
    return;
  }

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

function showCard(index) {
  if (index >= 0 && index < data.length) {
    currentIndex = index;
    renderCard(data[index]);
    localStorage.setItem("bookmark", index);
    updateNavButtons();
  }
}

function updateNavButtons() {
  document.getElementById("prevBtn").disabled = currentIndex <= 0;
  document.getElementById("nextBtn").disabled = currentIndex >= data.length - 1;
}

function initButtons() {
  document.getElementById("prevBtn").addEventListener("click", () => {
    showCard(currentIndex - 1);
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    showCard(currentIndex + 1);
  });

  document.getElementById("bookmarkBtn").addEventListener("click", () => {
    localStorage.setItem("bookmark", currentIndex);
    alert(`Bookmarked card ${currentIndex + 1}`);
  });
}
