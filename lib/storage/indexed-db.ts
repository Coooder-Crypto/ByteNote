"use client";

const DB_NAME = "byte-note-offline";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const OUTBOX_STORE = "outbox";

type StoreName = typeof DRAFTS_STORE | typeof OUTBOX_STORE;

let dbPromise: Promise<IDBDatabase> | null = null;

const isBrowser = () => typeof window !== "undefined" && !!window.indexedDB;

export async function getDB() {
  if (!isBrowser()) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          db.createObjectStore(DRAFTS_STORE, { keyPath: "noteId" });
        }
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => T,
): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const objectStore = tx.objectStore(store);
    let result: T;
    try {
      result = fn(objectStore);
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export { DRAFTS_STORE, OUTBOX_STORE };
