"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNoteActions } from "@/hooks";
import EditorManager, { type EditorNote } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { noteStorage, queueStorage } from "@/lib/offline/note-storage";
import { remapNoteId } from "@/lib/storage/remap";

export default function useEditor(noteId: string) {
  const {
    meQuery,
    noteQuery,
    createNoteAsync,
    updateNoteAsync,
    createPending,
    updatePending,
  } = useNoteActions({
    noteId,
    withQueries: !isLocalId(noteId),
  });

  const manager = useMemo(
    () => new EditorManager(noteId, meQuery?.data?.id),
    [noteId, meQuery?.data?.id],
  );

  const [note, setNote] = useState<EditorNote>(() => manager.getNote());
  const [savingLocal, setSavingLocal] = useState(false);

  useEffect(() => {
    setNote(manager.hydrate(noteQuery?.data ?? undefined));
  }, [manager, noteQuery?.data]);

  const handleTitleChange = useCallback(
    (value: string) => setNote(manager.updateTitleAndNote(value)),
    [manager],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => setNote(manager.updateTagsAndNote(tags)),
    [manager],
  );

  const handleContentChange = useCallback(
    (markdown: string) => setNote(manager.updateMarkdownAndNote(markdown)),
    [manager],
  );

  const save = useCallback(async () => {
    setSavingLocal(true);
    const current = manager.getNote();
    const now = Date.now();
    const baseRecord = {
      title: current.title || "未命名笔记",
      markdown: current.markdown,
      tags: current.tags,
      folderId: current.folderId,
      isCollaborative: current.isCollaborative,
    };
    const payload = {
      ...baseRecord,
      version: current.version,
    };
    const localId = isLocalId(noteId);
    const offlineNow =
      typeof navigator !== "undefined" ? !navigator.onLine : false;

    await noteStorage.save({
      id: noteId,
      ...baseRecord,
      updatedAt: now,
      syncStatus: offlineNow || localId ? "dirty" : "synced",
      tempId: localId ? noteId : undefined,
    });

    try {
      if (localId) {
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
        }
        return;
      }

      if (offlineNow) {
        await queueStorage.enqueue({
          noteId,
          action: "update",
          payload: {
            id: noteId,
            ...payload,
          },
          timestamp: now,
        });
        return;
      }

      await updateNoteAsync({
        id: noteId,
        ...payload,
      });
      await noteStorage.save({
        id: noteId,
        ...baseRecord,
        updatedAt: now,
        syncStatus: "synced",
      });
    } catch {
      if (offlineNow || localId) {
        await queueStorage.enqueue({
          noteId,
          action: localId ? "create" : "update",
          payload: {
            id: localId ? undefined : noteId,
            ...payload,
          },
          timestamp: now,
          tempId: localId ? noteId : undefined,
        });
      }
      throw new Error("保存失败");
    } finally {
      setSavingLocal(false);
    }
  }, [createNoteAsync, manager, noteId, updateNoteAsync]);

  const handleSave = useCallback(async () => {
    const snap = manager.getNote();
    if (!snap.access.canEdit || snap.access.isTrashed) return;
    setNote(snap);
    await save();
  }, [manager, save]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  useEffect(() => {
    const canPersist = () => note.access.canEdit && !note.access.isTrashed;
    const timer = window.setInterval(() => {
      if (!canPersist()) return;
      void save();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [note.access.canEdit, note.access.isTrashed, save]);

  const saving = savingLocal || createPending || updatePending;

  return {
    note,
    saving,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
  };
}
