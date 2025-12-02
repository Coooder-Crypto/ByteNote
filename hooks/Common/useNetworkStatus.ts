"use client";

import { useEffect, useState } from "react";

import { networkWatcher } from "@/lib/offline/netStatus";

export default function useNetworkStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const unsubscribe = networkWatcher.subscribe(setOnline);
    const stop = networkWatcher.start();
    return () => {
      unsubscribe();
      stop?.();
    };
  }, []);

  return online;
}
