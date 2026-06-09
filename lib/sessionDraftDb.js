const DB_NAME = 'productividad_surtidores_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_drafts';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB no disponible en servidor'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'key'
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode = 'readonly') {
  const db = await openDb();
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

export async function saveSessionDraft(key, data) {
  const store = await transaction('readwrite');

  return new Promise((resolve, reject) => {
    const payload = {
      key,
      data,
      updated_at: new Date().toISOString()
    };

    const request = store.put(payload);

    request.onsuccess = () => resolve(payload);
    request.onerror = () => reject(request.error);
  });
}

export async function getSessionDraft(key) {
  const store = await transaction('readonly');

  return new Promise((resolve, reject) => {
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSessionDraft(key) {
  const store = await transaction('readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export function getDraftKeyBySessionId(sessionId) {
  return `session_${sessionId}`;
}