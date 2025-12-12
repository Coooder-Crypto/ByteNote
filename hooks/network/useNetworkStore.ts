"use client";

import { useSession } from "next-auth/react";
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
  window.setInterval(() => {
    void probe();
  }, 15000);
  monitorStarted = true;
}

export default function useNetworkStatus() {
  const { online, reachable, setStatus } = useNetworkStore();
  const { status } = useSession();
  const loggedIn = status === "authenticated";

  useEffect(() => {
    if (!loggedIn) {
      setStatus(false, false);
      return;
    }
    const start = () => startNetworkMonitor(setStatus);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as typeof window & { requestIdleCallback?: IdleRequestCallback })
        .requestIdleCallback?.(() => start());
    } else {
      setTimeout(start, 0);
    }
    return () => {
      // keep monitor running globally; no cleanup on unmount to avoid losing listeners
    };
  }, [loggedIn, setStatus]);

  const canUseNetwork = () => loggedIn && online && reachable;

  return { online: loggedIn && online && reachable, reachable, canUseNetwork };
}
