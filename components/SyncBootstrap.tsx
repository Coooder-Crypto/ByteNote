"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import useLocalSync from "@/hooks/Common/useLocalSync";

// Lightweight helper to mount global sync logic (online listener + queue flush)
export default function SyncBootstrap() {
  const { online, stats } = useLocalSync();
  const prevOnline = useRef<boolean | null>(null);

  useEffect(() => {
    if (prevOnline.current === null) {
      prevOnline.current = online;
      return;
    }
    if (online === prevOnline.current) return;

    if (!online) {
      toast.info("已切换到离线模式，编辑内容会保存在本地", {
        id: "network-status",
        duration: 3000,
      });
    } else {
      const message =
        stats.pending > 0
          ? `网络恢复，正在同步 ${stats.pending} 条笔记`
          : "网络恢复，可继续编辑";
      toast.success(message, {
        id: "network-status",
        duration: 2500,
      });
    }
    prevOnline.current = online;
  }, [online, stats.pending]);

  return null;
}
