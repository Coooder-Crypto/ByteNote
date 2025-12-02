"use client";

import {
  getDB,
  type LocalNoteRecord,
  type QueueItem,
  STORE_META,
  STORE_NOTES,
  STORE_QUEUE,
} from "./db";

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

export const queueStorage = {
  async enqueue(item: QueueItem) {
    const timestamp = item.timestamp ?? Date.now();

    return run(STORE_QUEUE, "readwrite", (os) =>
      os.add({
        ...item,
        timestamp,
        status: "pending",
      }),
    );
  },
  async listPending(): Promise<QueueItem[]> {
    const db = await getDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, "readonly");
      const idx = tx.objectStore(STORE_QUEUE).index("status");
      const req = idx.getAll("pending");
      req.onsuccess = () => resolve((req.result ?? []) as QueueItem[]);
      req.onerror = () => reject(req.error);
    });
  },
  async remove(id?: number) {
    if (typeof id !== "number") return;
    return run(STORE_QUEUE, "readwrite", (os) => os.delete(id));
  },
};

export const metaStorage = {
  async set(key: string, value: unknown) {
    return run(STORE_META, "readwrite", (os) => os.put({ key, value }));
  },
  async get<T>(key: string): Promise<T | null> {
    const req = await run<IDBRequest<{ key: string; value: T } | undefined>>(
      STORE_META,
      "readonly",
      (os) => os.get(key),
    );
    if (!req) return null;
    return new Promise((resolve, reject) => {
      req.onsuccess = () =>
        resolve((req.result?.value as T | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  },
};
