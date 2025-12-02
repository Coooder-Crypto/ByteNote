"use client";

import { getDB, type LocalNoteRecord, STORE_NOTES } from "./db";

export const noteStorage = {
  async save(note: LocalNoteRecord) {
    const db = await getDB();
    if (!db) {
      console.warn("[noteStorage] save: DB unavailable");
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readwrite");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.put(note);
      req.onsuccess = () => {
        console.log("[noteStorage] save success", note.id, {
          updatedAt: note.updatedAt,
          syncStatus: note.syncStatus,
        });
      };
      req.onerror = () => {
        console.warn("[noteStorage] save error", note.id, req.error);
        reject(req.error);
      };
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  },

  async remove(id: string) {
    const db = await getDB();
    if (!db) {
      console.warn("[noteStorage] remove: DB unavailable");
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readwrite");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn("[noteStorage] remove error", id, req.error);
        reject(req.error);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  async get(id: string): Promise<LocalNoteRecord | null> {
    console.log("[noteStorage] get start", id);
    const db = await getDB();
    if (!db) {
      console.warn("[noteStorage] get: DB unavailable", id);
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readonly");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.get(id);
      req.onsuccess = () => {
        console.log("[noteStorage] get success", id, req.result);
        resolve(req.result ?? null);
      };
      req.onerror = () => {
        console.warn("[noteStorage] get error", id, req.error);
        reject(req.error);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  async list(): Promise<LocalNoteRecord[]> {
    const db = await getDB();
    if (!db) {
      console.warn("[noteStorage] list: DB unavailable");
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readonly");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.getAll();
      req.onsuccess = () => {
        const res = (req.result ?? []) as LocalNoteRecord[];
        console.log("[noteStorage] list success", {
          count: res.length,
          sample: res.slice(0, 2),
        });
        resolve(res);
      };
      req.onerror = () => {
        console.warn("[noteStorage] list: error", req.error);
        reject(req.error);
      };
      tx.onerror = () => reject(tx.error);
    });
  },
};

// queueStorage/metaStorage removed in favor of LocalManager-managed snapshots.
