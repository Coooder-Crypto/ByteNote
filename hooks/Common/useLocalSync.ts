"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { isLocalId } from "@/lib/offline/ids";
import { noteStorage, queueStorage } from "@/lib/offline/note-storage";
import { listOutboxItems, removeOutboxItem } from "@/lib/storage/outbox";
import { remapNoteId } from "@/lib/storage/remap";

import useNoteActions from "../Actions/useNoteActions";

type SyncStats = {
  pending: number;
  syncing: boolean;
  lastSyncedId?: string;
};

export default function useLocalSync() {
  const { createNoteAsync, updateNoteAsync } = useNoteActions({});
  const [stats, setStats] = useState<SyncStats>({ pending: 0, syncing: false });
  const syncingRef = useRef(false);

  const flush = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    // eslint-disable-next-line no-console
    console.log("[localSync] flush start");
    try {
      const outbox = await listOutboxItems();
      const queue = await queueStorage.listPending();
      const combined = [
        ...outbox.map((item) => ({
          source: "outbox" as const,
          ts: item.timestamp ?? Date.now(),
          ...item,
        })),
        ...queue.map((item) => ({
          source: "queue" as const,
          ts: item.timestamp ?? Date.now(),
          ...item,
        })),
      ].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));

      setStats((prev) => ({
        ...prev,
        pending: combined.length,
        syncing: true,
      }));
      if (combined.length > 0) {
        toast.loading(`同步中（${combined.length}）`, { id: "outbox-sync" });
      }

      for (const item of combined) {
        if (!item) continue;
        // eslint-disable-next-line no-console
        console.log("[localSync] processing", item);

        if (
          item.action === "create" ||
          (item.action === "update" &&
            isLocalId((item.payload as any)?.id as string))
        ) {
          const payload = item.payload as {
            id?: string;
            title?: string;
            markdown?: string;
            tags?: string[];
            folderId?: string | null;
            isCollaborative?: boolean;
          };
          const created = await createNoteAsync({
            title: payload.title ?? "",
            markdown: payload.markdown ?? "",
            tags: payload.tags ?? [],
            folderId: payload.folderId ?? undefined,
            isCollaborative: payload.isCollaborative ?? false,
          });
          if (created?.id) {
            const prevId = payload.id || item.noteId;
            if (prevId) {
              await remapNoteId(prevId, created.id);
              const cached = await noteStorage.get(prevId);
              if (cached) {
                await noteStorage.remove(prevId);
                await noteStorage.save({
                  ...cached,
                  id: created.id,
                  tempId: undefined,
                  syncStatus: "synced",
                });
              }
            }
          }
        } else if (item.action === "update") {
          const payload = item.payload as {
            id?: string;
            title?: string;
            markdown?: string;
            tags?: string[];
            folderId?: string | null;
            isCollaborative?: boolean;
            version?: number;
          };
          if (payload.id) {
            await updateNoteAsync({
              id: payload.id,
              title: payload.title ?? "",
              markdown: payload.markdown ?? "",
              tags: payload.tags,
              folderId: payload.folderId ?? undefined,
              isCollaborative: payload.isCollaborative,
              version: payload.version,
            });
          }
        }

        if (item.source === "outbox") {
          await removeOutboxItem(item.id);
        }
        if (item.source === "queue") {
          await queueStorage.remove(item.id as number | undefined);
        }
        setStats((prev) => ({ ...prev, lastSyncedId: item.noteId }));
      }
    } catch {
      // keep queue; retry on next online
    } finally {
      syncingRef.current = false;
      const remainingOutbox = await listOutboxItems();
      const remainingQueue = await queueStorage.listPending();
      const pending = remainingOutbox.length + remainingQueue.length;
      setStats({
        pending,
        syncing: false,
        lastSyncedId: undefined,
      });
      // eslint-disable-next-line no-console
      console.log("[localSync] flush done, pending:", pending);
      if (pending === 0) {
        toast.success("离线内容已同步", { id: "outbox-sync" });
      } else {
        toast.loading(`同步中（剩余 ${pending}）`, { id: "outbox-sync" });
      }
    }
  }, [createNoteAsync, updateNoteAsync]);

  useEffect(() => {
    const handleOnline = () => {
      if (typeof navigator === "undefined" || !navigator.onLine) return;
      void flush();
    };
    if (typeof navigator === "undefined" || navigator.onLine) {
      void flush();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flush]);

  return { flush, stats };
}
