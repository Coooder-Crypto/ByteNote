"use client";

import useLocalSync from "@/hooks/Common/useLocalSync";

// Lightweight helper to mount global sync logic (online listener + queue flush)
export default function SyncBootstrap() {
  useLocalSync();
  return null;
}
