"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NoteDraft } from "@/lib/storage/drafts";
import { getDraft, removeDraft, saveDraft } from "@/lib/storage/drafts";
import {
  addOutboxItem,
  listOutboxItems,
  removeOutboxItem,
} from "@/lib/storage/outbox";

type FlushResult = {
  synced: number;
  failed: number;
};

export default function useOfflineNote<TPayload>(noteId: string) {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const mountedRef = useRef(true);

  const refreshPending = useCallback(async () => {
    const items = await listOutboxItems<TPayload>(noteId);
    if (!mountedRef.current) return;
    setPendingCount(items.length);
  }, [noteId]);

  useEffect(() => {
    mountedRef.current = true;
    const refresh = () => {
      void refreshPending();
    };
    const handleOnline = () => {
      setOffline(false);
      refresh();
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // initial read after listeners
    refresh();
    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshPending]);

  const loadDraft = useCallback(async () => {
    const draft = await getDraft(noteId);
    if (!mountedRef.current) return null;
    setHasLocalDraft(Boolean(draft));
    return draft;
  }, [noteId]);

  const persistDraft = useCallback(
    async (draft: Omit<NoteDraft, "noteId" | "updatedAt">) => {
      const payload: NoteDraft = {
        ...draft,
        noteId,
        updatedAt: Date.now(),
      };
      await saveDraft(payload);
      if (mountedRef.current) {
        setHasLocalDraft(true);
      }
    },
    [noteId],
  );

  const clearDraft = useCallback(async () => {
    await removeDraft(noteId);
    if (mountedRef.current) {
      setHasLocalDraft(false);
    }
  }, [noteId]);

  const enqueueUpdate = useCallback(
    async (payload: TPayload) => {
      await addOutboxItem<TPayload>({
        noteId,
        payload,
        timestamp: Date.now(),
      });
      if (mountedRef.current) {
        setOffline(typeof navigator !== "undefined" ? !navigator.onLine : true);
        await refreshPending();
      }
    },
    [noteId, refreshPending],
  );

  const flushQueue = useCallback(
    async (
      sender: (payload: TPayload) => Promise<unknown>,
    ): Promise<FlushResult> => {
      if (flushing) return { synced: 0, failed: 0 };
      setFlushing(true);
      const items = await listOutboxItems<TPayload>(noteId);
      let synced = 0;
      let failed = 0;
      for (const item of items) {
        try {
          await sender(item.payload);
          await removeOutboxItem(item.id);
          synced += 1;
        } catch {
          failed += 1;
          setOffline(typeof navigator !== "undefined" ? !navigator.onLine : true);
          break;
        }
      }
      await refreshPending();
      if (mountedRef.current) {
        setFlushing(false);
      }
      return { synced, failed };
    },
    [flushing, noteId, refreshPending],
  );

  const markOffline = useCallback(() => {
    if (!mountedRef.current) return;
    setOffline(true);
  }, []);

  return {
    offline,
    pendingCount,
    flushing,
    hasLocalDraft,
    loadDraft,
    saveDraft: persistDraft,
    clearDraft,
    enqueueUpdate,
    flushQueue,
    markOffline,
  };
}
