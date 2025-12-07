"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Descendant } from "slate";
import type { SharedType } from "slate-yjs";
import { toSharedType, toSlateDoc } from "slate-yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { toPlainText } from "@/components/Editor/slate/normalize";

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
  isOwner = false,
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
  const metaListenerRef = useRef<((event: Y.YEvent<any>) => void) | null>(null);
  const syncRef = useRef<{
    doc: Y.Doc;
    sharedType: SharedType;
    meta: Y.Map<any>;
    provider: WebsocketProvider;
    wsUrl: string;
    noteId: string;
  } | null>(null);

  useEffect(() => {
    console.log("[collab] effect", { noteId, enabled, wsUrl });
    let statusListener:
      | ((event: { status: "connected" | "disconnected" }) => void)
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

    setStatus("connecting");
    console.log("[collab] connecting", { noteId, wsUrl });
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
      setMetaVersionState(nextVersion);
    } else {
      metaVersionRef.current = null;
      setMetaVersionState(null);
    }

    metaListenerRef.current = () => {
      const next = readMetaVersion();
      if (metaVersionRef.current === next) return;
      metaVersionRef.current = next;
      setMetaVersionState(next);
    };
    meta.observe(metaListenerRef.current);
    metaListenerRef.current();

    const seedOrFallback = () =>
      Array.isArray(seedContentRef.current) && seedContentRef.current.length > 0
        ? seedContentRef.current
        : [{ type: "paragraph", children: [{ text: "" }] }];

    const applySeed = () => {
      const seed = seedOrFallback();
      doc.transact(() => {
        shared.delete(0, shared.length);
        toSharedType(shared, seed as any);
      });
      try {
        const after = toSlateDoc(shared as any);
        console.log("[collab] apply seed on sync", {
          noteId,
          wsUrl,
          length: Array.isArray(after) ? after.length : "n/a",
          text: toPlainText(after),
        });
      } catch {
        // ignore logging errors
      }
      seededRef.current = true;
    };

    const provider = new WebsocketProvider(wsUrl!, noteId, doc);
    provider.on("synced", () => {
      if (!seededRef.current) {
        applySeed();
      }
    });
    statusListener = (event: { status: "connected" | "disconnected" }) => {
      const next =
        event.status === "connected" ? "connected" : ("error" as const);
      console.log("[collab] status", { noteId, wsUrl, status: next });
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
    setSharedType(shared);

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
