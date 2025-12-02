"use client";

import { parseStoredTags } from "../tags";
import type { LocalNoteRecord } from "./db";
import { createLocalId, isLocalId } from "./ids";
import { noteStorage } from "./note-storage";

type NotePayload = {
  id: string;
  title: string;
  markdown: string;
  tags: string[];
  folderId: string | null;
  isCollaborative: boolean;
  version?: number;
  updatedAt?: number;
  syncStatus?: LocalNoteRecord["syncStatus"];
};

type SyncActions = {
  createNote: (payload: {
    title: string;
    markdown: string;
    tags: string[];
    folderId?: string;
    isCollaborative: boolean;
    version?: number;
  }) => Promise<{ id?: string } | null | undefined>;
  updateNote: (payload: {
    id: string;
    title: string;
    markdown: string;
    tags?: string[];
    folderId?: string;
    isCollaborative?: boolean;
    version?: number;
  }) => Promise<unknown>;
};

class LocalManager {
  isOnline() {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  }

  isOffline() {
    return !this.isOnline();
  }

  async saveNote(payload: NotePayload) {
    const now = payload.updatedAt ?? Date.now();
    const record: LocalNoteRecord = {
      id: payload.id,
      title: payload.title,
      markdown: payload.markdown,
      tags: payload.tags,
      folderId: payload.folderId,
      updatedAt: now,
      syncStatus: payload.syncStatus ?? (this.isOnline() ? "synced" : "dirty"),
      tempId: isLocalId(payload.id)
        ? payload.id
        : payload.syncStatus === "dirty"
          ? payload.id
          : undefined,
      isCollaborative: payload.isCollaborative,
      version: payload.version,
    };
    await noteStorage.save(record);
    return record;
  }

  async createLocal(
    payload: Omit<NotePayload, "id" | "syncStatus" | "updatedAt">,
  ) {
    const id = createLocalId();
    await this.saveNote({
      ...payload,
      id,
      folderId: payload.folderId ?? null,
      syncStatus: "dirty",
      updatedAt: Date.now(),
    });
    return id;
  }

  async get(noteId: string) {
    return noteStorage.get(noteId);
  }

  async listAll() {
    const list = await noteStorage.list();
    console.log("[localManager] listAll", list.length, list.slice(0, 2));
    return list;
  }

  async listDirty() {
    const all = await this.listAll();
    return all.filter(
      (note) => note.syncStatus !== "synced" || isLocalId(note.id),
    );
  }

  async mergeFromServer(
    serverNotes: Array<{
      id: string;
      title: string | null;
      markdown: string | null;
      tags: string | string[] | null;
      folderId: string | null;
      updatedAt: Date | string | number | null;
      isCollaborative: boolean | null;
      version?: number | null;
    }>,
  ) {
    let pulled = 0;
    for (const note of serverNotes) {
      try {
        console.log(serverNotes);
        console.log("[localManager] merge start", note.id);
        const local = await noteStorage.get(note.id);
        const serverUpdatedAt = note.updatedAt
          ? new Date(note.updatedAt as any).getTime()
          : Date.now();
        if (!local) {
          console.log("[localManager] merge insert", note.id, serverUpdatedAt);
          await noteStorage.save({
            id: note.id,
            title: note.title ?? "未命名笔记",
            markdown: note.markdown ?? "",
            tags: parseStoredTags(note.tags ?? []),
            folderId: note.folderId ?? null,
            updatedAt: serverUpdatedAt,
            syncStatus: "synced",
            isCollaborative: note.isCollaborative ?? false,
            version:
              typeof note.version === "number" ? note.version : undefined,
          });
          pulled += 1;
          continue;
        }
        const localUpdated = Number(local.updatedAt) || 0;
        console.log("[localManager] merge compare", {
          id: note.id,
          serverUpdatedAt,
          localUpdated,
        });
        if (serverUpdatedAt > localUpdated) {
          await noteStorage.save({
            ...local,
            title: note.title ?? "未命名笔记",
            markdown: note.markdown ?? "",
            tags: parseStoredTags(note.tags ?? []),
            folderId: note.folderId ?? null,
            updatedAt: serverUpdatedAt,
            syncStatus: "synced",
            isCollaborative: note.isCollaborative ?? false,
            version:
              typeof note.version === "number" ? note.version : undefined,
          });
          pulled += 1;
        } else if (serverUpdatedAt < localUpdated && !isLocalId(local.id)) {
          // Local is newer; mark dirty to push on next sync.
          await noteStorage.save({
            ...local,
            syncStatus: "dirty",
          });
        }
      } catch (err) {
        console.warn("[localManager] mergeFromServer failed", note.id, err);
      }
    }
    console.log("[localManager] merge summary", { pulled });
    return pulled;
  }

  async markSynced(noteId: string, overrides?: Partial<LocalNoteRecord>) {
    const existing = await noteStorage.get(noteId);
    if (!existing) return;
    await noteStorage.save({
      ...existing,
      ...overrides,
      tempId: undefined,
      syncStatus: "synced",
    });
  }

  async remap(oldId: string, newId: string) {
    const existing = await noteStorage.get(oldId);
    if (!existing) return;
    await noteStorage.remove(oldId);
    await noteStorage.save({
      ...existing,
      id: newId,
      tempId: undefined,
      syncStatus: "synced",
      updatedAt: Date.now(),
    });
  }

  async syncDirty(actions: SyncActions) {
    const dirty = await this.listDirty();
    let lastSyncedId: string | undefined;
    for (const record of dirty) {
      try {
        if (isLocalId(record.id)) {
          const created = await actions.createNote({
            title: record.title ?? "",
            markdown: record.markdown ?? "",
            tags: record.tags ?? [],
            folderId: record.folderId ?? undefined,
            isCollaborative: record.isCollaborative ?? false,
            version: record.version,
          });
          if (created?.id) {
            await this.remap(record.id, created.id);
            lastSyncedId = created.id;
          }
        } else {
          await actions.updateNote({
            id: record.id,
            title: record.title ?? "",
            markdown: record.markdown ?? "",
            tags: record.tags,
            folderId: record.folderId ?? undefined,
            isCollaborative: record.isCollaborative,
            version: record.version,
          });
          await this.markSynced(record.id, { updatedAt: Date.now() });
          lastSyncedId = record.id;
        }
      } catch {
        // Keep dirty; retry later
      }
    }
    const remaining = await this.listDirty();
    return {
      pending: remaining.length,
      lastSyncedId,
    };
  }
}

export const localManager = new LocalManager();
