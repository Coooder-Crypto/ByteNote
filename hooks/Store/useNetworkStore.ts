"use client";

import { useEffect } from "react";
import { create } from "zustand";

type NetworkState = {
  online: boolean;
  reachable: boolean;
  setStatus: (online: boolean, reachable: boolean) => void;
};

const useNetworkStore = create<NetworkState>((set) => ({
  online: false,
  reachable: false,
  setStatus: (online, reachable) => set({ online, reachable }),
}));

const HEALTH_URL = "/api/trpc/health";
let monitorStarted = false;
let monitorCleanup: (() => void) | null = null;

function startNetworkMonitor(setStatus: NetworkState["setStatus"]) {
  if (monitorStarted || typeof window === "undefined") return;
  monitorStarted = true;

  const probe = async () => {
    if (!navigator.onLine) {
      setStatus(false, false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 3000);
      const url = `${HEALTH_URL}?ts=${Date.now()}&input=null`;
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const ok = res.ok;
      setStatus(ok, ok);
      return ok;
    } catch {
      setStatus(false, false);
      return false;
    }
  };

  const handle = () => {
    const isOnline = navigator.onLine;
    setStatus(isOnline, isOnline);
    if (isOnline) {
      void probe();
    }
  };

  window.addEventListener("online", handle);
  window.addEventListener("offline", handle);
  handle();
  const timer = window.setInterval(() => {
    void probe();
  }, 15000);

  monitorCleanup = () => {
    window.removeEventListener("online", handle);
    window.removeEventListener("offline", handle);
    window.clearInterval(timer);
  };
}

export function useNetworkStatus() {
  const { online, reachable, setStatus } = useNetworkStore();

  useEffect(() => {
    startNetworkMonitor(setStatus);
    return () => {
      // keep monitor running globally; no cleanup on unmount to avoid losing listeners
    };
  }, [setStatus]);

  const canUseNetwork = () => online && reachable;

  return { online: online && reachable, reachable, canUseNetwork };
}

export default useNetworkStore;
