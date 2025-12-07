"use client";

import { getDB, STORE_NOTES } from "./db";
import type { LocalNoteRecord } from "@/types";

export const noteStorage = {
  async save(note: LocalNoteRecord) {
    const db = await getDB();
    if (!db) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readwrite");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.put(note);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  },

  async remove(id: string) {
    const db = await getDB();
    if (!db) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readwrite");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async get(id: string): Promise<LocalNoteRecord | null> {
    const db = await getDB();
    if (!db) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readonly");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async list(): Promise<LocalNoteRecord[]> {
    const db = await getDB();
    if (!db) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readonly");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as LocalNoteRecord[]);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async clear() {
    const db = await getDB();
    if (!db) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, "readwrite");
      const os = tx.objectStore(STORE_NOTES);
      const req = os.clear();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },
};
