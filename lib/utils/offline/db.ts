"use client";

const DB_NAME = "byte-note-offline-v3";
const DB_VERSION = 1;

export const STORE_NOTES = "notes";

const isSupported = () =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined";

let dbPromise: Promise<IDBDatabase> | null = null;

export async function getDB() {
  if (!isSupported()) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const open = () => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => {
          if ((req.error as DOMException | null)?.name === "VersionError") {
            console.warn("[indexedDB] VersionError, deleting DB and retrying", {
              name: DB_NAME,
              version: DB_VERSION,
            });
            indexedDB.deleteDatabase(DB_NAME).onsuccess = () => open();
            return;
          }
          console.warn("[indexedDB] open error", req.error);
          reject(req.error);
        };
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NOTES)) {
            db.createObjectStore(STORE_NOTES, { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          resolve(req.result);
        };
      };
      open();
    });
  }
  return dbPromise;
}
