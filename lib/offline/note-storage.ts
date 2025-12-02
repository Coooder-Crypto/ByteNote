"use client";

import { getDB, type LocalNoteRecord, STORE_NOTES } from "./db";

async function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (os: IDBObjectStore) => T,
): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    let result: T;
    try {
      result = fn(os);
    } catch (e) {
      reject(e);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export const noteStorage = {
  async save(note: LocalNoteRecord) {
    return run(STORE_NOTES, "readwrite", (os) => os.put(note));
  },
  async remove(id: string) {
    return run(STORE_NOTES, "readwrite", (os) => os.delete(id));
  },
  async get(id: string): Promise<LocalNoteRecord | null> {
    const req = await run<IDBRequest<LocalNoteRecord | undefined>>(
      STORE_NOTES,
      "readonly",
      (os) => os.get(id),
    );
    if (!req) return null;
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  },

  async list(): Promise<LocalNoteRecord[]> {
    const req = await run<IDBRequest<LocalNoteRecord[]>>(
      STORE_NOTES,
      "readonly",
      (os) => os.getAll(),
    );
    if (!req) return [];
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve((req.result ?? []) as LocalNoteRecord[]);
      req.onerror = () => reject(req.error);
    });
  },
};

// queueStorage/metaStorage removed in favor of LocalManager-managed snapshots.
