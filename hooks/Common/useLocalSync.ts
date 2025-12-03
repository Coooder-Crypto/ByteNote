"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { localManager } from "@/lib/offline/local-manager";
import { trpc } from "@/lib/trpc/client";

import useNoteActions from "../Actions/useNoteActions";
import { useNetworkStatus } from "../Store/useNetworkStore";

type SyncStats = {
  pending: number;
  syncing: boolean;
  lastSyncedId?: string;
};

export default function useLocalSync() {
  const { createNoteAsync, updateNoteAsync } = useNoteActions({});
  const [stats, setStats] = useState<SyncStats>({ pending: 0, syncing: false });
  const syncingRef = useRef(false);
  const { online, canUseNetwork } = useNetworkStatus();
  const noteListQuery = trpc.note.list.useQuery(undefined, {
    enabled: canUseNetwork(),
    staleTime: 30000,
  });

  const flush = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const dirty = await localManager.listDirty();
      setStats((prev) => ({
        ...prev,
        pending: dirty.length,
        syncing: true,
      }));
      if (dirty.length > 0) {
        toast.loading(`同步中（${dirty.length}）`, { id: "outbox-sync" });
      }

      const result = await localManager.syncDirty({
        createNote: createNoteAsync,
        updateNote: updateNoteAsync,
      });

      if (noteListQuery.data) {
        await localManager.mergeFromServer(noteListQuery.data);
      }

      setStats((prev) => ({
        ...prev,
        lastSyncedId: result.lastSyncedId,
      }));
    } catch {
      // keep dirty; retry on next online
    } finally {
      syncingRef.current = false;
      const remaining = await localManager.listDirty();
      const pending = remaining.length;
      setStats({
        pending,
        syncing: false,
        lastSyncedId: undefined,
      });

      if (pending === 0) {
        toast.success("离线内容已同步", { id: "outbox-sync" });
      } else {
        toast.loading(`同步中（剩余 ${pending}）`, { id: "outbox-sync" });
      }
    }
  }, [createNoteAsync, updateNoteAsync]);

  useEffect(() => {
    if (!canUseNetwork()) return;
    void flush();
    const timer = window.setInterval(() => {
      if (syncingRef.current) return;
      void flush();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [canUseNetwork, flush, online]);

  useEffect(() => {
    if (!canUseNetwork()) return;
    if (noteListQuery.data) {
      void localManager.mergeFromServer(noteListQuery.data);
    }
  }, [canUseNetwork, noteListQuery.data]);

  return { flush, stats, online };
}
