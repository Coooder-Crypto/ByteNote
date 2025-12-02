"use client";

import { OUTBOX_STORE, withStore } from "./indexed-db";

export type OutboxItem<TPayload> = {
  id?: number;
  noteId: string;
  payload: TPayload;
  timestamp: number;
  action: "create" | "update";
  localOnly?: boolean;
};

export async function addOutboxItem<TPayload>(item: OutboxItem<TPayload>) {
  const now = Date.now();
  const dbRequest = await withStore<IDBRequest<IDBValidKey>>(
    OUTBOX_STORE,
    "readwrite",
    (store) => store.add({ ...item, timestamp: item.timestamp ?? now }),
  );
  if (!dbRequest) return undefined;
  return new Promise<number>((resolve, reject) => {
    dbRequest.onsuccess = () => resolve(Number(dbRequest.result));
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

export async function listOutboxItems<TPayload>(
  noteId?: string,
): Promise<OutboxItem<TPayload>[]> {
  const dbRequest = await withStore<IDBRequest<OutboxItem<TPayload>[]>>(
    OUTBOX_STORE,
    "readonly",
    (store) => store.getAll(),
  );
  if (!dbRequest) return [];
  return new Promise((resolve, reject) => {
    dbRequest.onsuccess = () => {
      const all = (dbRequest.result ?? []) as OutboxItem<TPayload>[];
      const filtered = noteId ? all.filter((item) => item.noteId === noteId) : all;
      resolve(filtered.sort((a, b) => a.timestamp - b.timestamp));
    };
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

export async function removeOutboxItem(id?: number) {
  if (typeof id !== "number") return;
  return withStore(OUTBOX_STORE, "readwrite", (store) => store.delete(id));
}

export async function clearOutbox(noteId?: string) {
  if (!noteId) {
    return withStore(OUTBOX_STORE, "readwrite", (store) => store.clear());
  }
  const items = await listOutboxItems(noteId);
  await Promise.all(items.map((item) => removeOutboxItem(item.id)));
}
