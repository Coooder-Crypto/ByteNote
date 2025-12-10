"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    // next-pwa exposes a global workbox helper when register: false
    const wb = (
      window as unknown as { workbox?: { register: () => Promise<void> } }
    ).workbox;
    if (wb?.register) {
      wb.register().catch((err) => console.warn("SW register failed", err));
      return;
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed", err));
    }
  }, []);
  return null;
}
