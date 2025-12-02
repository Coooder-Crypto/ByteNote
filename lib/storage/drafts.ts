"use client";

import { DRAFTS_STORE, withStore } from "./indexed-db";

export type NoteDraft = {
  noteId: string;
  title: string;
  markdown: string;
  tags: string[];
  folderId: string | null;
  isCollaborative: boolean;
  version?: number;
  updatedAt: number;
  status?: "local-only" | "server";
};

export async function saveDraft(draft: NoteDraft) {
  return withStore(DRAFTS_STORE, "readwrite", (store) => store.put(draft));
}

export async function getDraft(noteId: string): Promise<NoteDraft | null> {
  const dbResult = await withStore<IDBRequest<NoteDraft | undefined>>(
    DRAFTS_STORE,
    "readonly",
    (store) => store.get(noteId),
  );
  if (!dbResult) return null;
  return new Promise((resolve, reject) => {
    dbResult.onsuccess = () => resolve(dbResult.result ?? null);
    dbResult.onerror = () => reject(dbResult.error);
  });
}

export async function removeDraft(noteId: string) {
  return withStore(DRAFTS_STORE, "readwrite", (store) => store.delete(noteId));
}

export async function listDrafts(): Promise<NoteDraft[]> {
  const dbResult = await withStore<IDBRequest<NoteDraft[]>>(
    DRAFTS_STORE,
    "readonly",
    (store) => store.getAll(),
  );
  if (!dbResult) return [];
  return new Promise((resolve, reject) => {
    dbResult.onsuccess = () => resolve((dbResult.result ?? []) as NoteDraft[]);
    dbResult.onerror = () => reject(dbResult.error);
  });
}
