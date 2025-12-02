"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNoteActions } from "@/hooks";
import EditorManager, { type EditorNote } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { localManager } from "@/lib/offline/local-manager";
import { useNetworkStatus } from "@/hooks/Store/useNetworkStore";

export default function useEditor(noteId: string) {
  const { online, canUseNetwork } = useNetworkStatus();
  const allowQueries = !isLocalId(noteId) && canUseNetwork();
  const {
    meQuery,
    noteQuery,
    createNoteAsync,
    updateNoteAsync,
    createPending,
    updatePending,
  } = useNoteActions({
    noteId,
    withQueries: allowQueries,
  });

  const manager = useMemo(
    () => new EditorManager(noteId, meQuery?.data?.id),
    [noteId, meQuery?.data?.id],
  );

  const [note, setNote] = useState<EditorNote>(() => manager.getNote());
  const [savingLocal, setSavingLocal] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const isLocal = isLocalId(noteId);

  useEffect(() => {
    setNote(manager.hydrate(noteQuery?.data ?? undefined));
    if (noteQuery?.data) {
      setPendingSync(false);
    }
  }, [manager, noteQuery?.data]);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      const cached = await localManager.get(noteId);
      if (cancelled || !cached) return;
      const hydrated = manager.hydrate({
        title: cached.title ?? "",
        markdown: cached.markdown ?? "",
        tags: cached.tags ?? [],
        isCollaborative: cached.isCollaborative ?? false,
        folderId: cached.folderId ?? null,
        isFavorite: false,
        version: cached.version,
        deletedAt: null,
        userId: undefined,
        collaborators: [],
      });
      if (!canUseNetwork()) {
        manager.setLocalEditable();
      }
      setNote(manager.getNote());
      setPendingSync(cached.syncStatus !== "synced" || isLocalId(cached.id));
    };
    void loadLocal();
    return () => {
      cancelled = true;
    };
  }, [canUseNetwork, manager, noteId]);

  const handleTitleChange = useCallback(
    (value: string) => {
      const next = manager.updateTitleAndNote(value);
      setNote(next);
      void localManager.saveNote({
        id: noteId,
        title: next.title,
        markdown: next.markdown,
        tags: next.tags,
        folderId: next.folderId ?? null,
        isCollaborative: next.isCollaborative,
        version: next.version,
        syncStatus: "dirty",
      });
      setPendingSync(true);
    },
    [manager, noteId],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const next = manager.updateTagsAndNote(tags);
      setNote(next);
      void localManager.saveNote({
        id: noteId,
        title: next.title,
        markdown: next.markdown,
        tags: next.tags,
        folderId: next.folderId ?? null,
        isCollaborative: next.isCollaborative,
        version: next.version,
        syncStatus: "dirty",
      });
      setPendingSync(true);
    },
    [manager, noteId],
  );

  const handleContentChange = useCallback(
    (markdown: string) => {
      const next = manager.updateMarkdownAndNote(markdown);
      setNote(next);
      const now = Date.now();
      void localManager.saveNote({
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
      setPendingSync(true);
    },
    [manager, noteId],
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
    const offlineNow = !canUseNetwork();

    const persistDirty = () =>
      localManager.saveNote({
        id: noteId,
        ...baseRecord,
        updatedAt: now,
        version: payload.version,
        syncStatus: "dirty",
      });

    await persistDirty();

    try {
      if (offlineNow) {
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
          setPendingSync(false);
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
      setPendingSync(false);
    } catch {
      await persistDirty();
      throw new Error("保存失败");
    } finally {
      setSavingLocal(false);
    }
  }, [canUseNetwork, createNoteAsync, isLocal, manager, noteId, updateNoteAsync]);

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
    pendingSync,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
  };
}
