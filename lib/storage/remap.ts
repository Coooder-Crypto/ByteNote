"use client";

import type { NoteDraft } from "./drafts";
import { DRAFTS_STORE, getDB,OUTBOX_STORE } from "./indexed-db";
import type { OutboxItem } from "./outbox";

/**
 * Remap local-only noteId to server id across drafts and outbox.
 */
export async function remapNoteId(oldId: string, newId: string) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction([DRAFTS_STORE, OUTBOX_STORE], "readwrite");
  const draftsStore = tx.objectStore(DRAFTS_STORE);
  const outboxStore = tx.objectStore(OUTBOX_STORE);

  // Remap draft
  const draftReq = draftsStore.get(oldId);
  draftReq.onsuccess = () => {
    const draft = draftReq.result as NoteDraft | undefined;
    if (draft) {
      const next = { ...draft, noteId: newId, status: "server" as const };
      draftsStore.delete(oldId);
      draftsStore.put(next);
    }
  };

  // Remap outbox items
  const outboxReq = outboxStore.getAll();
  outboxReq.onsuccess = () => {
    const items = (outboxReq.result ?? []) as OutboxItem<unknown>[];
    items.forEach((item) => {
      if (item.noteId === oldId) {
        const next = { ...item, noteId: newId, localOnly: false };
        if (item.id !== undefined) {
          outboxStore.delete(item.id);
        }
        outboxStore.add(next);
      }
    });
  };

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
