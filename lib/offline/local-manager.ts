"use client";

import type { LocalNoteRecord } from "./db";
import { createLocalId, isLocalId } from "./ids";
import { noteStorage } from "./note-storage";

type SnapshotPayload = {
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

  async saveSnapshot(payload: SnapshotPayload) {
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
    payload: Omit<SnapshotPayload, "id" | "syncStatus" | "updatedAt">,
  ) {
    const id = createLocalId();
    await this.saveSnapshot({
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
    return noteStorage.list();
  }

  async listDirty() {
    const all = await this.listAll();
    return all.filter(
      (note) => note.syncStatus !== "synced" || isLocalId(note.id),
    );
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
