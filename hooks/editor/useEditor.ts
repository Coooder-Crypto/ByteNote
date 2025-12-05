"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Descendant } from "slate";
import { toast } from "sonner";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { useNoteActions } from "@/hooks";
import { useNetworkStatus } from "@/hooks/Store/useNetworkStore";
import EditorManager, { type EditorNote } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { localManager } from "@/lib/offline/LocalManager";

export default function useEditor(noteId: string) {
  const { canUseNetwork } = useNetworkStatus();
  const canUse = canUseNetwork();
  const session = useSession();
  const loggedIn = session.status === "authenticated";
  const allowQueries = !isLocalId(noteId) && canUse && loggedIn;
  const {
    meQuery,
    noteQuery,
    createNoteAsync,
    updateNoteAsync,
    createPending,
    updatePending,
  } = useNoteActions({
    noteId,
    withQueries: allowQueries,
  });
  const currentUserId = meQuery?.data?.id ?? session.data?.user?.id;
  const manager = useMemo(
    () => new EditorManager(noteId, currentUserId),
    [noteId, currentUserId],
  );

  const [note, setNote] = useState<EditorNote>(() => manager.getNote());
  const [savingLocal, setSavingLocal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isLocal = isLocalId(noteId);
  const ySyncRef = useRef<{
    doc: Y.Doc;
    content: Y.Map<any>;
    provider: WebsocketProvider;
  } | null>(null);
  const wsWarnedRef = useRef(false);
  const suppressRemoteRef = useRef(false);

  useEffect(() => {
    const serverNote = noteQuery?.data;
    if (serverNote) {
      const next = manager.hydrate(serverNote);
      setNote(next);
      setHydrated(true);
    }
  }, [manager, noteQuery?.data]);

  useEffect(() => {
    if (hydrated) return;
    if (allowQueries && noteQuery?.data) return;

    let cancelled = false;
    const loadLocal = async () => {
      const cached = await localManager.get(noteId);
      if (cancelled) return;
      if (cached) {
        manager.hydrate({
          title: cached.title ?? "",
          contentJson: (cached.contentJson as Descendant[]) ?? [
            { type: "paragraph", children: [{ text: "" }] },
          ],
          tags: cached.tags ?? [],
          isCollaborative: cached.isCollaborative ?? false,
          folderId: cached.folderId ?? null,
          isFavorite: false,
          version: cached.version,
          deletedAt: null,
          userId: undefined,
          collaborators: [],
        });
        manager.setLocalEditable();
        setNote(manager.getNote());
      } else {
        manager.setLocalEditable();
        setNote(manager.getNote());
      }
      setHydrated(true);
    };
    void loadLocal();
    return () => {
      cancelled = true;
    };
  }, [allowQueries, hydrated, manager, noteId, noteQuery?.data]);

  useEffect(() => {
    if (!hydrated) return;
    if (!note.isCollaborative) return;
    if (!canUse || !loggedIn) return;

    let wsUrl: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      wsUrl = params.get("ws");
      if (!wsUrl) {
        wsUrl = localStorage.getItem("byte-note-ws-url");
      }
    }

    if (!wsUrl) {
      if (!wsWarnedRef.current) {
        toast.info("请在协作分享中填写协同服务器 WS 地址");
        wsWarnedRef.current = true;
      }
      return;
    }

    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      toast.error("WS 地址不合法，请检查");
      return;
    }

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(wsUrl, noteId, doc);
    const content = doc.getMap("content");
    ySyncRef.current = { doc, content, provider };

    const existing = content.get("json") as Descendant[] | undefined;
    if (existing && Array.isArray(existing)) {
      suppressRemoteRef.current = true;
      setNote(manager.updateContentAndNote(existing));
      suppressRemoteRef.current = false;
    } else {
      content.set("json", (note.contentJson as Descendant[]) ?? []);
    }

    const observer = () => {
      const incoming = content.get("json") as Descendant[] | undefined;
      if (!incoming || !Array.isArray(incoming)) return;
      suppressRemoteRef.current = true;
      setNote(manager.updateContentAndNote(incoming));
      suppressRemoteRef.current = false;
    };

    content.observe(observer);

    return () => {
      content.unobserve(observer);
      provider.destroy();
      doc.destroy();
      ySyncRef.current = null;
    };
  }, [
    canUse,
    hydrated,
    loggedIn,
    manager,
    note.contentJson,
    note.isCollaborative,
    noteId,
  ]);

  const handleTitleChange = useCallback(
    (value: string) => {
      if (!hydrated) return;
      const next = manager.updateTitleAndNote(value);
      setNote({ ...next });
    },
    [hydrated, manager, noteId],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      if (!hydrated) return;
      const next = manager.updateTagsAndNote(tags);
      setNote({ ...next });
    },
    [hydrated, manager, noteId],
  );

  const handleContentChange = useCallback(
    (contentJson: Descendant[]) => {
      if (!hydrated) return;
      const next = manager.updateContentAndNote(contentJson);
      setNote(next);
      if (suppressRemoteRef.current) return;
      const sync = ySyncRef.current;
      if (sync) {
        sync.content.set("json", contentJson);
      }
    },
    [hydrated, manager],
  );

  const save = useCallback(
    async (force = false) => {
      if (!force) return;
      setSavingLocal(true);
      const current = manager.getNote();
      const now = Date.now();
      const baseRecord = {
        title: current.title || "未命名笔记",
        contentJson: (note.contentJson as Descendant[]) ?? [
          { type: "paragraph", children: [{ text: "" }] },
        ],
        tags: current.tags,
        folderId: current.folderId,
        isCollaborative: current.isCollaborative,
      };

      const persistDirty = () =>
        localManager.saveNote({
          id: noteId,
          ...baseRecord,
          updatedAt: now,
          version: current.version,
          syncStatus: "dirty",
        });

      await persistDirty();

      if (!canUseNetwork()) {
        setSavingLocal(false);
        return;
      }

      try {
        if (isLocal) {
          const created = await createNoteAsync({
            title: baseRecord.title,
            contentJson: baseRecord.contentJson,
            tags: baseRecord.tags,
            folderId: baseRecord.folderId ?? undefined,
            isCollaborative: baseRecord.isCollaborative,
            version: current.version,
          });
          if (created?.id) {
            await localManager.remap(noteId, created.id);
            await localManager.markSynced(created.id, {
              updatedAt: now,
              version:
                typeof created.version === "number"
                  ? created.version
                  : current.version,
            });
            setNote((prev) => ({
              ...prev,
              version:
                typeof created.version === "number"
                  ? created.version
                  : prev.version,
            }));
          }
        } else {
          const updated = await updateNoteAsync({
            id: noteId,
            ...baseRecord,
            version: current.version,
          });
          await localManager.markSynced(noteId, {
            updatedAt: now,
            version:
              updated && typeof updated === "object" && "version" in updated
                ? (updated as any).version
                : current.version,
          });
          if (
            updated &&
            typeof updated === "object" &&
            "version" in updated &&
            typeof (updated as any).version === "number"
          ) {
            setNote((prev) => ({ ...prev, version: (updated as any).version }));
          }
        }
      } catch {
      } finally {
        setSavingLocal(false);
      }
    },
    [canUseNetwork, createNoteAsync, isLocal, manager, noteId, updateNoteAsync],
  );

  const handleSave = useCallback(async () => {
    const snap = manager.getNote();
    if (!snap.access.canEdit || snap.access.isTrashed) return;
    if (!snap.title.trim()) {
      toast.error("标题不能为空");
      return;
    }
    setNote(snap);
    await save(true);
  }, [manager, save]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const saving = savingLocal || createPending || updatePending;

  return {
    note,
    saving,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
  };
}
