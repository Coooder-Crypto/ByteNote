"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Descendant } from "slate";
import type { SharedType } from "slate-yjs";
import { toSharedType } from "slate-yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { DEFAULT_VALUE } from "@/lib/constants/editor";

type useSocketParams = {
  noteId: string;
  enabled: boolean;
  wsUrl: string | null;
  seedContent?: Descendant[];
  seedVersion?: number;
  isOwner?: boolean;
};

export default function useSocket({
  noteId,
  enabled,
  wsUrl,
  seedContent,
  seedVersion,
}: useSocketParams) {
  const seedContentRef = useRef<Descendant[] | undefined>(seedContent);
  useEffect(() => {
    seedContentRef.current = seedContent;
  }, [seedContent]);
  const [sharedType, setSharedType] = useState<SharedType | null>(null);
  const [metaVersion, setMetaVersionState] = useState<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const metaVersionRef = useRef<number | null>(null);
  const seededRef = useRef(false);
  const syncListenerRef = useRef<((isSynced: boolean) => void) | null>(null);
  const metaListenerRef = useRef<
    ((event: Y.YMapEvent<unknown>) => void) | null
  >(null);
  const syncRef = useRef<{
    doc: Y.Doc;
    sharedType: SharedType;
    meta: Y.Map<unknown>;
    provider: WebsocketProvider;
    wsUrl: string;
    noteId: string;
  } | null>(null);

  useEffect(() => {
    const validWs =
      !!wsUrl && (wsUrl.startsWith("ws://") || wsUrl.startsWith("wss://"));
    if (!enabled || !validWs) return;
    setTimeout(
      () => setStatus((prev) => (prev === "connecting" ? prev : "connecting")),
      0,
    );
  }, [enabled, wsUrl]);

  useEffect(() => {
    let statusListener:
      | ((event: {
          status: "connecting" | "connected" | "disconnected";
        }) => void)
      | null = null;

    const cleanup = () => {
      if (!syncRef.current) return;
      if (statusListener) {
        syncRef.current.provider.off("status", statusListener);
      }
      if (syncListenerRef.current) {
        syncRef.current.provider.off("sync", syncListenerRef.current);
      }
      if (metaListenerRef.current) {
        syncRef.current.meta.unobserve(metaListenerRef.current);
      }
      syncRef.current.provider.destroy();
      syncRef.current.doc.destroy();
      syncRef.current = null;
      setSharedType(null);
      setMetaVersionState(null);
      setStatus("idle");
      seededRef.current = false;
      syncListenerRef.current = null;
      metaListenerRef.current = null;
    };

    const validWs =
      !!wsUrl && (wsUrl.startsWith("ws://") || wsUrl.startsWith("wss://"));

    if (!enabled || !validWs) {
      cleanup();
      return;
    }

    cleanup();

    const doc = new Y.Doc();
    const shared = doc.getArray("content") as SharedType;
    const meta = doc.getMap("meta");

    const readMetaVersion = () => {
      const v = meta.get("version");
      return typeof v === "number" ? v : null;
    };

    const existingVersion = readMetaVersion();
    const nextVersion =
      typeof seedVersion === "number"
        ? seedVersion
        : typeof existingVersion === "number"
          ? existingVersion
          : null;
    if (typeof nextVersion === "number") {
      doc.transact(() => {
        meta.set("version", nextVersion);
      });
      metaVersionRef.current = nextVersion;
      setTimeout(() => setMetaVersionState(nextVersion), 0);
    } else {
      metaVersionRef.current = null;
      setTimeout(() => setMetaVersionState(null), 0);
    }

    const handleMeta = () => {
      const next = readMetaVersion();
      if (metaVersionRef.current === next) return;
      metaVersionRef.current = next;
      setMetaVersionState(next);
    };
    metaListenerRef.current = handleMeta;
    meta.observe(handleMeta);
    handleMeta();

    const seedOrFallback = (): Descendant[] =>
      Array.isArray(seedContentRef.current) && seedContentRef.current.length > 0
        ? seedContentRef.current
        : DEFAULT_VALUE;

    const applySeed = () => {
      const seed = seedOrFallback();
      doc.transact(() => {
        shared.delete(0, shared.length);
        toSharedType(shared, seed);
      });

      seededRef.current = true;
    };

    const provider = new WebsocketProvider(wsUrl!, noteId, doc);
    provider.on("sync", (isSynced: boolean) => {
      if (isSynced && !seededRef.current) {
        applySeed();
      }
    });
    statusListener = (event: {
      status: "connecting" | "connected" | "disconnected";
    }) => {
      const next =
        event.status === "connected"
          ? "connected"
          : event.status === "connecting"
            ? "connecting"
            : ("error" as const);

      setStatus(next);
    };
    provider.on("status", statusListener);
    syncListenerRef.current = (isSynced: boolean) => {
      if (!isSynced || seededRef.current) return;
      const hasContent = shared.length > 0;
      if (!hasContent) {
        applySeed();
      } else {
        seededRef.current = true;
      }
    };
    provider.on("sync", syncListenerRef.current);

    syncRef.current = {
      doc,
      sharedType: shared,
      meta,
      provider,
      wsUrl: wsUrl!,
      noteId,
    };
    setTimeout(() => setSharedType(shared), 0);

    return () => {
      cleanup();
    };
  }, [enabled, noteId, seedVersion, wsUrl]);

  const setMetaVersion = useCallback((version: number) => {
    if (!syncRef.current) return;
    syncRef.current.doc.transact(() => {
      syncRef.current?.meta.set("version", version);
    });
    metaVersionRef.current = version;
    setMetaVersionState(version);
  }, []);

  return { sharedType, status, metaVersion, setMetaVersion };
}
