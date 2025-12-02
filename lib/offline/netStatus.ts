"use client";

type Listener = (online: boolean) => void;

class NetworkWatcher {
  private listeners = new Set<Listener>();
  private online = typeof navigator !== "undefined" ? navigator.onLine : true;

  start() {
    if (typeof window === "undefined") return;
    const handle = () => {
      this.online = navigator.onLine;
      this.listeners.forEach((fn) => fn(this.online));
    };
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    // initial notify
    handle();
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.online);
    return () => this.listeners.delete(fn);
  }

  isOnline() {
    return this.online;
  }
}

export const networkWatcher = new NetworkWatcher();
