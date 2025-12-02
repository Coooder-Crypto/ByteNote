"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNoteActions } from "@/hooks";
import EditorManager, { type EditorNote } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { localManager } from "@/lib/offline/local-manager";

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
  const isLocal = isLocalId(noteId);

  useEffect(() => {
    setNote(manager.hydrate(noteQuery?.data ?? undefined));
  }, [manager, noteQuery?.data]);

  const handleTitleChange = useCallback(
    (value: string) => {
      const next = manager.updateTitleAndNote(value);
      setNote(next);
      const offlineNow = localManager.isOffline();
      if (offlineNow || isLocal) {
        void localManager.saveSnapshot({
          id: noteId,
          title: next.title,
          markdown: next.markdown,
          tags: next.tags,
          folderId: next.folderId ?? null,
          isCollaborative: next.isCollaborative,
          version: next.version,
          syncStatus: "dirty",
        });
      }
    },
    [isLocal, manager, noteId],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const next = manager.updateTagsAndNote(tags);
      setNote(next);
      const offlineNow = localManager.isOffline();
      if (offlineNow || isLocal) {
        void localManager.saveSnapshot({
          id: noteId,
          title: next.title,
          markdown: next.markdown,
          tags: next.tags,
          folderId: next.folderId ?? null,
          isCollaborative: next.isCollaborative,
          version: next.version,
          syncStatus: "dirty",
        });
      }
    },
    [isLocal, manager, noteId],
  );

  const handleContentChange = useCallback(
    (markdown: string) => {
      const next = manager.updateMarkdownAndNote(markdown);
      setNote(next);
      const offlineNow = localManager.isOffline();
      if (offlineNow || isLocal) {
        const now = Date.now();
        void localManager.saveSnapshot({
          id: noteId,
          title: next.title,
          markdown: next.markdown,
          tags: next.tags,
          folderId: next.folderId ?? null,
          isCollaborative: next.isCollaborative,
          version: next.version,
          updatedAt: now,
          syncStatus: "dirty",
        });
      }
    },
    [isLocal, manager, noteId],
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
    const offlineNow =
      typeof navigator !== "undefined" ? !navigator.onLine : false;

    await localManager.saveSnapshot({
      id: noteId,
      ...baseRecord,
      updatedAt: now,
      version: payload.version,
      syncStatus: "dirty",
    });

    try {
      if (offlineNow) {
        await localManager.saveSnapshot({
          id: noteId,
          ...baseRecord,
          updatedAt: now,
          version: payload.version,
          syncStatus: "dirty",
        });
        return;
      }

      if (isLocal) {
        const created = await createNoteAsync({
          title: baseRecord.title,
          markdown: baseRecord.markdown,
          tags: baseRecord.tags,
          folderId: baseRecord.folderId ?? undefined,
          isCollaborative: baseRecord.isCollaborative,
        });
        if (created?.id) {
          await localManager.remap(noteId, created.id);
          await localManager.markSynced(created.id, { updatedAt: now });
        }
        return;
      }

      await updateNoteAsync({
        id: noteId,
        ...payload,
      });
      await localManager.markSynced(noteId, {
        updatedAt: now,
        version: payload.version,
      });
    } catch {
      await localManager.saveSnapshot({
        id: noteId,
        ...baseRecord,
        updatedAt: now,
        version: payload.version,
        syncStatus: "dirty",
      });
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
