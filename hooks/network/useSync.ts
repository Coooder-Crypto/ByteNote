"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { localManager } from "@/lib/manager/LocalManager";

import useNoteActions from "../note/useNoteActions";
import useNetworkStatus from "./useNetworkStore";

type SyncStats = {
  pending: number;
  syncing: boolean;
  lastSyncedId?: string;
};

export default function useSync() {
  const { createNoteAsync, updateNoteAsync, fetchNote, useNoteListQuery } =
    useNoteActions({});
  const { online, canUseNetwork } = useNetworkStatus();
  const { status } = useSession();

  const [stats, setStats] = useState<SyncStats>({ pending: 0, syncing: false });
  const syncingRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);
  const renderRef = useRef(0);

  const canUse = canUseNetwork();
  const loggedIn = status === "authenticated";

  const noteListQuery = useNoteListQuery(undefined, {
    enabled: canUse && loggedIn,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refetchNotes = useMemo(
    () => noteListQuery.refetch,
    [noteListQuery.refetch],
  );

  const triggerFlushRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    triggerFlushRef.current = async () => {
      if (syncingRef.current || !loggedIn || !canUse) return;
      syncingRef.current = true;
      try {
        const dirty = await localManager.listDirty();
        const hasDirty = dirty.length > 0;

        if (hasDirty) {
          setStats((prev) => ({
            ...prev,
            pending: dirty.length,
            syncing: true,
          }));
          const result = await localManager.syncDirty({
            createNote: createNoteAsync,
            updateNote: updateNoteAsync,
            fetchNote,
          });
          setStats((prev) => ({ ...prev, lastSyncedId: result.lastSyncedId }));
        } else {
          setStats((prev) => ({ ...prev, pending: 0, syncing: false }));
        }

        const shouldRefetch = hasDirty || stats.pending === 0;
        if (shouldRefetch) {
          const serverNotes = await refetchNotes()
            .then((res) => (Array.isArray(res.data) ? res.data : []))
            .catch(() => []);

          if (serverNotes.length > 0) {
            await localManager.mergeFromServer(serverNotes);
          }
        }
      } finally {
        syncingRef.current = false;
        const remaining = await localManager.listDirty();
        const pending = remaining.length;
        setStats((prev) => ({
          ...prev,
          pending,
          syncing: false,
          lastSyncedId: undefined,
        }));

        if (pending > 0 && canUse && loggedIn) {
          if (!retryTimerRef.current) {
            retryTimerRef.current = window.setTimeout(() => {
              retryTimerRef.current = null;
              void triggerFlushRef.current();
            }, 10000);
          }
        } else if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      }
    };
  }, [
    canUse,
    createNoteAsync,
    fetchNote,
    loggedIn,
    refetchNotes,
    updateNoteAsync,
    stats.pending,
  ]);

  useEffect(() => {
    renderRef.current += 1;

    if (!canUse || !loggedIn) return;
    void triggerFlushRef.current();
  }, [canUse, loggedIn, online]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  return {
    flush: triggerFlushRef.current,
    stats,
    online,
    merging: syncingRef.current,
  };
}
