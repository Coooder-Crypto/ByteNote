"use client";

import { useCallback, useEffect, useState } from "react";

export default function useNetworkStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const canUseNetwork = useCallback(() => {
    // Keep a single place to define when network calls should be allowed.
    return online;
  }, [online]);

  return { online, canUseNetwork };
}
