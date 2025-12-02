"use client";

import { useCallback } from "react";

import type { EditorSnapshot } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { noteStorage, queueStorage } from "@/lib/offline/note-storage";
import { remapNoteId } from "@/lib/storage/remap";

import { useNoteActions } from "../Actions";

export default function useEditorPersistence(
  noteId: string,
  manager: { getSnapshot: () => EditorSnapshot },
  setNoteDetailCache?: ReturnType<typeof useNoteActions>["setNoteDetailCache"],
) {
  const { createNoteAsync, updateNoteAsync, updatePending } = useNoteActions({
    noteId,
  });

  const save = useCallback(async () => {
    const snapshot = manager.getSnapshot();
    const now = Date.now();
    const baseRecord = {
      title: snapshot.title || "未命名笔记",
      markdown: snapshot.markdown,
      tags: snapshot.tags,
      folderId: snapshot.folderId,
      isCollaborative: snapshot.isCollaborative,
    };
    const payload = {
      ...baseRecord,
      version: snapshot.version,
    };
    const isLocal = isLocalId(noteId);

    // Always keep local copy
    await noteStorage.save({
      id: noteId,
      ...baseRecord,
      updatedAt: now,
      syncStatus: "dirty",
      tempId: isLocal ? noteId : undefined,
    });

    try {
      if (isLocal) {
        const created = await createNoteAsync({
          title: baseRecord.title,
          markdown: baseRecord.markdown,
          tags: baseRecord.tags,
          folderId: baseRecord.folderId ?? undefined,
          isCollaborative: baseRecord.isCollaborative,
        });
        if (created?.id) {
          await remapNoteId(noteId, created.id);
          await noteStorage.save({
            id: created.id,
            ...baseRecord,
            updatedAt: now,
            syncStatus: "synced",
          });
          setNoteDetailCache?.(created.id, (prev) =>
            prev
              ? {
                  ...prev,
                  id: created.id,
                  title: baseRecord.title,
                  markdown: baseRecord.markdown,
                  tags: JSON.stringify(baseRecord.tags),
                  folderId: baseRecord.folderId ?? null,
                  isCollaborative: baseRecord.isCollaborative,
                  updatedAt: new Date(now).toISOString(),
                  deletedAt: null,
                  isFavorite: prev.isFavorite,
                  version: prev.version ?? 1,
                }
              : prev,
          );
        }
        return;
      }

      const updated = await updateNoteAsync({
        id: noteId,
        ...payload,
      });
      await noteStorage.save({
        id: noteId,
        ...baseRecord,
        updatedAt: now,
        syncStatus: "synced",
      });
      setNoteDetailCache?.(noteId, (prev) =>
        prev
          ? {
              ...prev,
              id: noteId,
              title: baseRecord.title,
              markdown: baseRecord.markdown,
              tags: JSON.stringify(baseRecord.tags),
              folderId: baseRecord.folderId ?? null,
              isCollaborative: baseRecord.isCollaborative,
              updatedAt: new Date(now).toISOString(),
              deletedAt: prev.deletedAt ?? null,
              isFavorite: prev.isFavorite,
              version:
                typeof updated?.version === "number"
                  ? updated.version
                  : (prev.version ?? payload.version ?? 1),
            }
          : prev,
      );
    } catch (error) {
      await queueStorage.enqueue({
        noteId,
        action: isLocal ? "create" : "update",
        payload: {
          id: isLocal ? undefined : noteId,
          ...payload,
        },
        timestamp: now,
        tempId: isLocal ? noteId : undefined,
      });
      throw error;
    }
  }, [createNoteAsync, manager, noteId, setNoteDetailCache, updateNoteAsync]);

  return { save, saving: updatePending };
}
