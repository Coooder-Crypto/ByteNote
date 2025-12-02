"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createPusherClient } from "@/lib/pusher/client";
import type { NoteDraft } from "@/lib/storage/drafts";

import useNoteActions from "../Actions/useNoteActions";
import useNoteStore from "../Store/useNoteStore";
import useOfflineNote from "./useOfflineNote";

type UseNoteSyncOptions = {
  noteId: string;
  canEdit: boolean;
  isTrashed: boolean;
};

export default function useNoteSync({
  noteId,
  canEdit,
  isTrashed,
}: UseNoteSyncOptions) {
  const { state, isDirty, setDirty, updateState } = useNoteStore();

  const { updateNoteAsync, updatePending } = useNoteActions({
    noteId,
    onStateChange: updateState,
    onDirtyChange: setDirty,
  });

  const {
    enqueueUpdate,
    flushQueue,
    saveDraft,
    offline,
    pendingCount,
    flushing,
    loadDraft,
    markOffline,
  } = useOfflineNote<Parameters<typeof updateNoteAsync>[0]>(noteId);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const [saving, setSaving] = useState(false);

  const buildPayload = useMemo(
    () => ({
      id: noteId,
      title: state.title || "未命名笔记",
      markdown: state.markdown,
      folderId: state.folderId,
      tags: state.tags,
      version: state.version,
      isCollaborative: state.isCollaborative,
    }),
    [
      noteId,
      state.folderId,
      state.isCollaborative,
      state.markdown,
      state.tags,
      state.title,
      state.version,
    ],
  );

  const syncOnce = useCallback(async () => {
    if (!canEdit || isTrashed) return;
    const payload = buildPayload;
    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }
    const run = (async () => {
      setSaving(true);
      let queuedOffline = false;
      try {
        const offlineNow =
          typeof navigator !== "undefined" ? !navigator.onLine : false;
        if (offlineNow) {
          queuedOffline = true;
          await enqueueUpdate(payload);
        } else {
          await updateNoteAsync(payload);
        }
      } catch {
        markOffline();
        queuedOffline = true;
        await enqueueUpdate(payload);
      } finally {
        if (queuedOffline) {
          setDirty(false);
        }
        setSaving(false);
      }
    })();
    savePromiseRef.current = run;
    try {
      await run;
    } finally {
      savePromiseRef.current = null;
    }
  }, [buildPayload, canEdit, enqueueUpdate, isTrashed, markOffline, updateNoteAsync]);

  // Auto save
  useEffect(() => {
    if (!canEdit || !isDirty || updatePending || isTrashed) return;
    const timer = window.setTimeout(() => {
      void syncOnce();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [canEdit, isDirty, updatePending, isTrashed, syncOnce]);

  // Cmd/Ctrl+S
  useEffect(() => {
    if (!canEdit || isTrashed) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void syncOnce();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [canEdit, isTrashed, syncOnce]);

  // Persist draft locally while editing
  useEffect(() => {
    if (!canEdit || isTrashed) return;
    const timer = window.setTimeout(() => {
      void saveDraft({
        title: state.title,
        markdown: state.markdown,
        tags: state.tags,
        folderId: state.folderId,
        isCollaborative: state.isCollaborative,
        version: state.version,
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [
    canEdit,
    isTrashed,
    saveDraft,
    state.folderId,
    state.isCollaborative,
    state.markdown,
    state.tags,
    state.title,
    state.version,
  ]);

  // Flush outbox when back online
  useEffect(() => {
    if (offline || flushing || pendingCount === 0) return;
    void flushQueue(updateNoteAsync);
  }, [flushQueue, offline, pendingCount, flushing, updateNoteAsync]);

  // Safety net: ensure saving flag clears when mutation/flushing结束
  useEffect(() => {
    if (!updatePending && !flushing && !savePromiseRef.current) {
      setSaving(false);
    }
  }, [flushing, pendingCount, updatePending]);

  const applyDraft = useCallback(async (): Promise<boolean> => {
    const draft = (await loadDraft()) as NoteDraft | null;
    if (!draft) return false;
    updateState((prev) => ({
      ...prev,
      title: draft.title ?? prev.title,
      markdown: draft.markdown ?? prev.markdown,
      tags: draft.tags ?? prev.tags,
      folderId:
        draft.folderId !== undefined ? draft.folderId : (prev.folderId ?? null),
      isCollaborative:
        draft.isCollaborative !== undefined
          ? draft.isCollaborative
          : prev.isCollaborative,
      version: draft.version ?? prev.version,
    }));
    setDirty(true);
    return true;
  }, [loadDraft, setDirty, updateState]);

  // Auto apply draft silently on mount
  useEffect(() => {
    void applyDraft();
  }, [applyDraft]);

  // Listen to server-saved updates (fallback when Yjs not in sync)
  useEffect(() => {
    if (!state.isCollaborative) return;
    const pusher = createPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`presence-note-${noteId}`);
    const handler = (payload: {
      noteId: string;
      markdown?: string;
      title?: string;
      version?: number;
    }) => {
      if (payload?.noteId !== noteId) return;
      updateState((prev) => ({
        ...prev,
        markdown: payload.markdown ?? prev.markdown,
        title: payload.title ?? prev.title,
        version:
          typeof payload.version === "number" ? payload.version : prev.version,
      }));
      setDirty(false);
    };
    channel.bind("server-note-saved", handler);
    return () => {
      channel.unbind("server-note-saved", handler);
      pusher.unsubscribe(`presence-note-${noteId}`);
      pusher.disconnect();
    };
  }, [noteId, setDirty, state.isCollaborative, updateState]);

  return {
    isSaving: saving || updatePending || flushing,
    saveNow: syncOnce,
    offline,
    pendingCount,
  };
}
