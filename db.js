const DB_NAME = "pothanaDB";
const STORE_NAME = "padyams";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function saveRows(rows) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  rows.forEach(r => store.put(r));
  return tx.complete;
}

async function getRow(id) {
  const db = await openDB();
  return db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
}
