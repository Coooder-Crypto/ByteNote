"use client";

const DB_NAME = "byte-note-offline-v1";
const DB_VERSION = 1;

const STORE_NOTES = "notes";
const STORE_QUEUE = "queue";
const STORE_META = "meta";

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
};

export type QueueItem = {
  id?: number;
  noteId: string;
  action: "create" | "update" | "delete";
  payload: Partial<LocalNoteRecord>;
  timestamp: number;
  status?: "pending" | "syncing" | "failed";
  tempId?: string;
};

export type MetaRecord = {
  key: string;
  value: unknown;
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
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          const store = db.createObjectStore(STORE_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
  }
  return dbPromise;
}

export { STORE_META, STORE_NOTES, STORE_QUEUE };
