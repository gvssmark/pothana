let currentIndex = 0;
let data = [];

function renderCard(row) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = `
    <div class="card">
      <h2>${row.skandhamu} – ${row.ghattamu} – ${row.pasam}</h2>
      <p class="padyam">${row.padyam}</p>
      <p class="meaning">${row.teeka}</p>
      <p class="bhavam">${row.tippani}</p>
    </div>
  `;
}

function showCard(index) {
  if (index >= 0 && index < data.length) {
    currentIndex = index;
    renderCard(data[index]);
    localStorage.setItem("bookmark", index);
  }
}

function initSwipe() {
  let startY = 0;
  document.body.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  document.body.addEventListener("touchend", e => {
    let endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) showCard(currentIndex + 1); // swipe up
    else if (endY - startY > 50) showCard(currentIndex - 1); // swipe down
  });
}
