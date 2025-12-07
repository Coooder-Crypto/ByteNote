"use client";

import { parseStoredTags } from "@/lib/constants/tags";
import { createLocalId, isLocalId } from "@/lib/utils/offline/ids";
import { noteStorage } from "@/lib/utils/offline/noteStorage";
import type { LocalNoteRecord } from "@/types";

type NotePayload = {
  id: string;
  title: string;
  contentJson: any;
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
    contentJson: any;
    tags: string[];
    folderId?: string;
    isCollaborative: boolean;
    version?: number;
  }) => Promise<{ id?: string } | null | undefined>;
  updateNote: (payload: {
    id: string;
    title: string;
    contentJson: any;
    tags?: string[];
    folderId?: string;
    isCollaborative?: boolean;
    version?: number;
  }) => Promise<
    | {
        version?: number | null;
        updatedAt?: Date | string | number | null;
      }
    | unknown
  >;
  fetchNote?: (id: string) => Promise<{
    id: string;
    title: string | null;
    contentJson: any;
    tags: string | string[] | null;
    folderId: string | null;
    updatedAt: Date | string | number | null;
    isCollaborative: boolean | null;
    version?: number | null;
  } | null>;
};

class LocalManager {
  isOnline() {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  }

  isOffline() {
    return !this.isOnline();
  }

  async saveNote(payload: NotePayload) {
    const title = (payload.title ?? "").trim() || "未命名笔记";
    const contentJson = payload.contentJson ?? {};
    const tags = payload.tags ?? [];
    const folderId = payload.folderId ?? null;
    const now = payload.updatedAt ?? Date.now();
    const record: LocalNoteRecord = {
      id: payload.id,
      title,
      contentJson,
      tags,
      folderId,
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
      contentJson: any;
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
        const local = await noteStorage.get(note.id);
        const serverUpdatedAt = note.updatedAt
          ? new Date(note.updatedAt as any).getTime()
          : Date.now();
        const serverContent = (note as any).contentJson ?? {};
        const serverTitle = note.title ?? "未命名笔记";
        const serverTags = parseStoredTags(note.tags ?? []);
        const serverFolder = note.folderId ?? null;
        const serverVersion =
          typeof note.version === "number" ? note.version : undefined;
        if (!local) {
          await noteStorage.save({
            id: note.id,
            title: serverTitle,
            contentJson: serverContent,
            tags: serverTags,
            folderId: serverFolder,
            updatedAt: serverUpdatedAt,
            syncStatus: "synced",
            isCollaborative: note.isCollaborative ?? false,
            version: serverVersion,
          });
          pulled += 1;
          continue;
        }
        const localUpdated = Number(local.updatedAt) || 0;
        if (serverUpdatedAt > localUpdated) {
          await noteStorage.save({
            ...local,
            title: serverTitle,
            contentJson: serverContent,
            tags: serverTags,
            folderId: serverFolder,
            updatedAt: serverUpdatedAt,
            syncStatus: "synced",
            isCollaborative: note.isCollaborative ?? false,
            version: serverVersion,
          });
          pulled += 1;
        }
      } catch (err) {
        console.warn("[localManager] mergeFromServer failed", note.id, err);
      }
    }
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
        const title = (record.title ?? "").trim() || "未命名笔记";
        const contentJson = record.contentJson ?? {};
        const tags = record.tags ?? [];
        const safeRecord = { ...record, title, contentJson, tags };
        // 更新本地为安全值，避免重复发送空数据
        await noteStorage.save({ ...safeRecord, syncStatus: "dirty" });

        if (isLocalId(record.id)) {
          const created = await actions.createNote({
            title,
            contentJson,
            tags,
            folderId: record.folderId ?? undefined,
            isCollaborative: record.isCollaborative ?? false,
            version: record.version,
          });
          if (created?.id) {
            await this.remap(record.id, created.id);
            lastSyncedId = created.id;
          }
        } else {
          const updated = await actions.updateNote({
            id: record.id,
            title,
            contentJson,
            tags,
            folderId: record.folderId ?? undefined,
            isCollaborative: record.isCollaborative,
            version: record.version,
          });
          if (updated && typeof updated === "object" && "version" in updated) {
            await this.markSynced(record.id, {
              updatedAt: Date.now(),
              version:
                typeof (updated as any).version === "number"
                  ? (updated as any).version
                  : record.version,
            });
          } else {
            await this.markSynced(record.id, { updatedAt: Date.now() });
          }
          lastSyncedId = record.id;
        }
      } catch (err) {
        // 版本冲突/不存在时，拉取服务器数据覆盖本地，避免无限重试
        if (
          err instanceof Error &&
          (err.message?.includes("NOT_FOUND") ||
            (err as any).data?.code === "NOT_FOUND")
        ) {
          try {
            const serverNote = await actions.fetchNote?.(record.id);
            if (serverNote) {
              await this.mergeFromServer([serverNote]);
            } else {
              // 服务器不存在，放弃这条记录，防止死循环
              await noteStorage.remove(record.id);
            }
          } catch {
            // ignore, keep dirty for next retry
          }
        }
      }
    }
    const remaining = await this.listDirty();
    return {
      pending: remaining.length,
      lastSyncedId,
    };
  }

  async clearAll() {
    await noteStorage.clear();
  }
}

export const localManager = new LocalManager();
