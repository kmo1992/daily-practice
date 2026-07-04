// On-device storage for workout recordings (IndexedDB).
//
// Videos are stored as Blobs entirely on the device — nothing is uploaded.
// IndexedDB is used (rather than OPFS) because Safari/iOS support for
// writable file streams is still patchy, while Blob storage in IndexedDB is
// solid everywhere this app runs. Large sessions run 100MB+, so the list UI
// offers delete; browsers may prompt for or cap storage under pressure.

const DB_NAME = 'daily-practice-recordings';
const STORE = 'recordings';

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = (db, mode, fn) =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const req = fn(store);
    transaction.oncomplete = () => resolve(req?.result);
    transaction.onerror = () => reject(transaction.error);
  });

// Save a recording; returns its id.
export const saveRecording = async ({ label, blob, mime }) => {
  const db = await openDb();
  const id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const record = {
    id,
    label,
    mime,
    blob,
    size: blob.size,
    createdAt: new Date().toISOString(),
  };
  await tx(db, 'readwrite', (store) => store.put(record));
  db.close();
  return id;
};

// Newest first, without materializing blobs into the UI until played.
export const listRecordings = async () => {
  const db = await openDb();
  const all = await tx(db, 'readonly', (store) => store.getAll());
  db.close();
  return (all || [])
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(({ id, label, mime, size, createdAt }) => ({ id, label, mime, size, createdAt }));
};

export const getRecording = async (id) => {
  const db = await openDb();
  const rec = await tx(db, 'readonly', (store) => store.get(id));
  db.close();
  return rec || null;
};

export const deleteRecording = async (id) => {
  const db = await openDb();
  await tx(db, 'readwrite', (store) => store.delete(id));
  db.close();
};
