"use client";

const DB_NAME = "byte-note-offline-v1";
const DB_VERSION = 1;

const STORE_NOTES = "notes";

export type LocalNoteRecord = {
  id: string;
  title: string;
  markdown: string;
  tags: string[];
  folderId: string | null;
  updatedAt: number;
  deleted?: boolean;
  tempId?: string;
  syncStatus?: "dirty" | "synced" | "pending";
  isCollaborative?: boolean;
  version?: number;
};

const isSupported = () =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined";

let dbPromise: Promise<IDBDatabase> | null = null;

export async function getDB() {
  if (!isSupported()) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          db.createObjectStore(STORE_NOTES, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
  }
  return dbPromise;
}

export { STORE_NOTES };
