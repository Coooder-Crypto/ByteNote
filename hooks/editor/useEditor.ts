"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Descendant } from "slate";
import type { SharedType } from "slate-yjs";
import { toSlateDoc } from "slate-yjs";
import { toast } from "sonner";

import { DEFAULT_VALUE } from "@/lib/constants/editor";
import EditorManager from "@/lib/manager/EditorManager";
import { localManager } from "@/lib/manager/LocalManager";
import { isLocalId } from "@/lib/utils/offline/ids";
import { type AiMeta, type EditorNote } from "@/types";

import { useNetworkStatus, useSocket } from "../network";
import { useNoteActions } from "../note";

export default function useEditor(
  noteId: string,
  opts?: {
    collabEnabled?: boolean;
  },
) {
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
    fetchNote,
  } = useNoteActions({
    noteId,
    withQueries: allowQueries,
  });
  const currentUserId = meQuery?.data?.id ?? session.data?.user?.id;
  const manager = useMemo(
    () => new EditorManager(noteId, currentUserId),
    [noteId, currentUserId],
  );

  const extractVersion = (input: unknown): number | undefined => {
    if (
      input &&
      typeof input === "object" &&
      "version" in input &&
      typeof (input as { version?: unknown }).version === "number"
    ) {
      return (input as { version: number }).version;
    }
    return undefined;
  };

  const extractAiMeta = useCallback(
    (input: unknown) =>
      input && typeof input === "object" ? (input as AiMeta) : undefined,
    [],
  );

  const getErrorCode = (err: unknown): string => {
    if (err && typeof err === "object") {
      const dataCode = (err as { data?: { code?: string } }).data?.code;
      if (typeof dataCode === "string") return dataCode;
      const shapeCode = (err as { shape?: { code?: string } }).shape?.code;
      if (typeof shapeCode === "string") return shapeCode;
      const message = (err as { message?: string }).message;
      if (typeof message === "string") return message;
    }
    return "UNKNOWN";
  };

  const [note, setNote] = useState<EditorNote>(() => manager.getNote());
  const [savingLocal, setSavingLocal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isLocal = isLocalId(noteId);
  const [sharedType, setSharedType] = useState<SharedType | null>(null);
  const retryingRef = useRef(false);

  // Reset hydration state when switching notes so Slate mounts with correct initialValue.
  useEffect(() => {
    setHydrated(false);
    retryingRef.current = false;
    setNote(manager.getNote());
  }, [manager, noteId]);

  useEffect(() => {
    const serverNote = noteQuery?.data;
    if (serverNote) {
      const aiMeta = extractAiMeta(serverNote.aiMeta);
      const next = manager.hydrate({
        ...serverNote,
        aiMeta,
      });
      setNote(next);
      setHydrated(true);
    }
  }, [extractAiMeta, manager, noteQuery?.data]);

  useEffect(() => {
    if (hydrated) return;
    if (allowQueries && noteQuery?.data) return;
    // If we're online and this is a remote note, wait for session to resolve
    // so we don't mount Slate with empty local fallback first.
    if (!isLocal && canUseNetwork() && session.status === "loading") return;

    let cancelled = false;
    const hasMeaningfulContent = (raw: unknown): boolean => {
      if (!Array.isArray(raw) || raw.length === 0) return false;
      for (const node of raw as any[]) {
        if (
          node &&
          typeof node === "object" &&
          Array.isArray((node as any).children)
        ) {
          for (const child of (node as any).children) {
            if (
              child &&
              typeof child === "object" &&
              typeof (child as any).text === "string" &&
              (child as any).text.trim() !== ""
            ) {
              return true;
            }
          }
        }
      }
      return false;
    };
    const loadLocal = async () => {
      const cached = await localManager.get(noteId);
      if (cancelled) return;

      // For remote notes when queries are allowed, don't hydrate from empty local
      // fallback. Wait for server content unless the query errors.
      const shouldWaitForServer =
        allowQueries &&
        !isLocal &&
        !noteQuery?.isError &&
        (!cached || !hasMeaningfulContent(cached.contentJson));

      if (shouldWaitForServer) return;

      if (cached) {
        manager.hydrate({
          title: cached.title ?? "",
          contentJson:
            Array.isArray(cached.contentJson) && cached.contentJson.length > 0
              ? cached.contentJson
              : [{ type: "paragraph", children: [{ text: "" }] }],
          tags: cached.tags ?? [],
          isCollaborative: cached.isCollaborative ?? false,
          folderId: cached.folderId ?? null,
          isFavorite: false,
          summary: cached.summary ?? "",
          aiMeta: cached.aiMeta,
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
  }, [
    allowQueries,
    canUseNetwork,
    hydrated,
    isLocal,
    manager,
    noteId,
    noteQuery?.data,
    noteQuery?.isError,
    session.status,
  ]);

  const collab = useSocket({
    noteId,
    enabled:
      hydrated &&
      note.isCollaborative &&
      canUse &&
      loggedIn &&
      (opts?.collabEnabled ?? true),
    wsUrl: typeof note.collabWsUrl === "string" ? note.collabWsUrl : null,
    seedContent:
      Array.isArray(note.contentJson) && note.contentJson.length > 0
        ? note.contentJson
        : undefined,
    seedVersion: note.version,
    isOwner: note.access.isOwner,
  });

  useEffect(() => {
    setSharedType(collab.sharedType);
  }, [collab.sharedType]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof collab.metaVersion !== "number") return;
    if (collab.metaVersion === note.version) return;
    const next = manager.updateVersionAndNote(collab.metaVersion);
    setNote((prev) => {
      if (prev.version === next.version) return prev;
      return { ...next };
    });
  }, [collab.metaVersion, hydrated, manager, note.version]);

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

  const setCollaborative = useCallback(
    (enabled: boolean) => {
      if (!hydrated) return;
      const next = manager.updateCollaborativeAndNote(enabled);
      setNote({ ...next });
    },
    [hydrated, manager],
  );

  const setCollabWs = useCallback(
    (ws: string | null) => {
      manager.updateCollabWsUrl(ws);
      setNote((prev) => ({ ...prev, collabWsUrl: ws }));
    },
    [manager],
  );

  const handleContentChange = useCallback(
    (contentJson: Descendant[]) => {
      if (!hydrated) return;
      if (sharedType) return;
      const next = manager.updateContentAndNote(contentJson);
      setNote(next);
    },
    [hydrated, manager, sharedType],
  );

  const save = useCallback(
    async (force = false) => {
      if (!force) return;
      setSavingLocal(true);
      const current = manager.getNote();
      const now = Date.now();
      const shouldSyncNow = canUseNetwork();
      const contentFromShared: Descendant[] =
        sharedType && sharedType.length > 0
          ? (toSlateDoc(sharedType) as unknown as Descendant[])
          : current.contentJson.length > 0
            ? current.contentJson
            : DEFAULT_VALUE;
      const baseRecord = {
        title: current.title || "未命名笔记",
        contentJson: contentFromShared,
        tags: current.tags,
        folderId: current.folderId,
        isCollaborative: current.isCollaborative,
        collabWsUrl: current.collabWsUrl ?? null,
        summary: current.summary ?? "",
        aiMeta: current.aiMeta,
      };

      const persistDirty = () =>
        localManager.saveNote({
          id: noteId,
          ...baseRecord,
          updatedAt: now,
          version: current.version,
          syncStatus: shouldSyncNow ? "pending" : "dirty",
        });

      await persistDirty();

      if (!shouldSyncNow) {
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
            collabWsUrl: baseRecord.collabWsUrl ?? undefined,
            summary: baseRecord.summary,
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
            if (typeof created.version === "number") {
              manager.updateVersion(created.version);
              collab.setMetaVersion(created.version);
            }
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
          const updatedVersion = extractVersion(updated);
          await localManager.markSynced(noteId, {
            updatedAt: now,
            version: updatedVersion ?? current.version,
          });
          if (typeof updatedVersion === "number") {
            manager.updateVersion(updatedVersion);
            collab.setMetaVersion(updatedVersion);
            setNote((prev) => ({ ...prev, version: updatedVersion }));
          }
        }
      } catch (err: unknown) {
        const code = getErrorCode(err);
        const needRetry =
          !retryingRef.current && (code === "NOT_FOUND" || code === "CONFLICT");
        if (needRetry) {
          retryingRef.current = true;
          const latest = await fetchNote(noteId);
          const latestVersion = extractVersion(latest);
          if (typeof latestVersion === "number") {
            manager.updateVersion(latestVersion);
            collab.setMetaVersion(latestVersion);
            setNote((prev) => ({
              ...prev,
              version: latestVersion,
            }));
            // retry once with refreshed version
            return await save(true);
          }
        }
        // mark dirty so background sync can retry later
        await localManager.saveNote({
          id: noteId,
          title: baseRecord.title,
          contentJson: baseRecord.contentJson,
          tags: baseRecord.tags,
          folderId: baseRecord.folderId ?? null,
          isCollaborative: baseRecord.isCollaborative,
          version: manager.getNote().version,
          updatedAt: now,
          syncStatus: "dirty",
          summary: baseRecord.summary,
          aiMeta: baseRecord.aiMeta,
        });
      } finally {
        retryingRef.current = false;
        setSavingLocal(false);
      }
    },
    [
      canUseNetwork,
      collab,
      createNoteAsync,
      fetchNote,
      isLocal,
      manager,
      noteId,
      updateNoteAsync,
      sharedType,
    ],
  );

  const handleSave = useCallback(async () => {
    if (typeof collab.metaVersion === "number") {
      manager.updateVersion(collab.metaVersion);
    }
    const snap = manager.getNote();
    if (!snap.access.canEdit || snap.access.isTrashed) return;
    if (!snap.title.trim()) {
      toast.error("标题不能为空");
      return;
    }
    await save(true);
  }, [collab.metaVersion, manager, save]);

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

  const applyServerUpdate = useCallback(
    (payload: {
      title?: string;
      contentJson?: Descendant[];
      summary?: string | null;
      tags?: string[];
      version?: number;
      aiMeta?: AiMeta;
      isFavorite?: boolean;
    }) => {
      if (!hydrated) return;
      if (typeof payload.title === "string") manager.updateTitle(payload.title);
      if (Array.isArray(payload.tags)) manager.updateTags(payload.tags);
      if (payload.contentJson) manager.updateContentJson(payload.contentJson);
      if (payload.summary !== undefined)
        manager.updateSummary(payload.summary ?? "");
      if (payload.aiMeta !== undefined) manager.updateAiMeta(payload.aiMeta);
      if (typeof payload.isFavorite === "boolean")
        manager.updateFavorite(payload.isFavorite);
      if (typeof payload.version === "number") {
        manager.updateVersion(payload.version);
        collab.setMetaVersion?.(payload.version);
      }
      setNote({ ...manager.getNote() });
    },
    [collab, hydrated, manager],
  );

  return {
    note,
    saving,
    hydrated,
    sharedType,
    collabStatus: collab.status,
    flushCollabToServer: async () => {
      if (typeof collab.metaVersion === "number") {
        manager.updateVersion(collab.metaVersion);
      }
      await save(true);
    },
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
    setCollabWs,
    setCollaborative,
    applyServerUpdate,
  };
}
