"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import useSync from "@/hooks/Common/useSync";

export default function SyncBootstrap() {
  const { online, stats, merging } = useSync();
  const prevSyncing = useRef<boolean>(false);
  const prevPending = useRef<number | null>(null);
  const prevMerging = useRef<boolean>(false);

  useEffect(() => {
    if (!online) {
      toast.dismiss("sync-progress");
      toast.dismiss("note-merge");
      prevSyncing.current = false;
      prevPending.current = null;
      prevMerging.current = false;
      return;
    }

    const finishedSync =
      prevSyncing.current && !stats.syncing && stats.pending === 0;

    // 仅在有同步过程且完成时提示成功
    if (finishedSync) {
      toast.success("离线内容已同步", {
        id: "sync-progress",
        duration: 1800,
      });
    } else if (stats.syncing && stats.pending > 0) {
      toast.loading(`同步中（${stats.pending}）`, { id: "sync-progress" });
    } else if (stats.pending > 0) {
      toast.loading(`同步中（剩余 ${stats.pending}）`, {
        id: "sync-progress",
      });
    } else if (!stats.syncing && stats.pending === 0) {
      toast.dismiss("sync-progress");
    }

    prevSyncing.current = stats.syncing;
    prevPending.current = stats.pending;
  }, [online, stats.pending, stats.syncing]);

  useEffect(() => {
    if (!online) return;
    if (merging && !prevMerging.current) {
      toast.loading("正在与服务器同步笔记", { id: "note-merge" });
    } else if (!merging && prevMerging.current) {
      toast.dismiss("note-merge");
    }
    prevMerging.current = merging;
  }, [merging, online]);

  return null;
}
