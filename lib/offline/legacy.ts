"use client";

import type { LocalNoteRecord } from "./db";
import { noteStorage } from "./note-storage";

const LEGACY_DB = "byte-note-offline";
const LEGACY_STORE = "drafts";

export async function migrateLegacyDrafts(): Promise<LocalNoteRecord[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];

  const openReq = indexedDB.open(LEGACY_DB);
  const drafts = await new Promise<any[]>((resolve) => {
    openReq.onerror = () => resolve([]);
    openReq.onsuccess = () => {
      const db = openReq.result;
      if (!db.objectStoreNames.contains(LEGACY_STORE)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(LEGACY_STORE, "readonly");
      const store = tx.objectStore(LEGACY_STORE);
      const getAllReq = store.getAll();
      getAllReq.onerror = () => resolve([]);
      getAllReq.onsuccess = () => {
        resolve((getAllReq.result ?? []) as any[]);
      };
    };
  });

  if (!drafts.length) return [];

  const records: LocalNoteRecord[] = drafts.map((d) => ({
    id: d.noteId,
    title: d.title ?? "未命名笔记",
    contentJson: d.markdown ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: d.markdown }] }] } : { type: "doc", content: [] },
    tags: d.tags ?? [],
    folderId: d.folderId ?? null,
    updatedAt: d.updatedAt ?? Date.now(),
    syncStatus: "dirty",
    tempId: d.noteId,
    isCollaborative: d.isCollaborative ?? false,
    version: d.version,
  }));

  await Promise.all(records.map((r) => noteStorage.save(r)));
  return records;
}
