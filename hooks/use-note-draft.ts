"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DraftState = {
  title: string;
  markdown: string;
  isPublic: boolean;
  tags: string[];
};

const emptyState: DraftState = {
  title: "",
  markdown: "",
  isPublic: false,
  tags: [],
};

export function useNoteDraft(noteId: string) {
  const storageKey = `note-draft-${noteId}`;
  const [state, setState] = useState<DraftState>(emptyState);
  const [isDirty, setIsDirty] = useState(false);
  const localMetaRef = useRef<{ updatedAt: number; isDirty: boolean }>({
    updatedAt: 0,
    isDirty: false,
  });
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    if (draftLoadedRef.current) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        draftLoadedRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as {
        state: DraftState;
        updatedAt?: number;
        isDirty?: boolean;
      };
      if (parsed.state) {
        setState(parsed.state);
      }
      setIsDirty(Boolean(parsed.isDirty));
      if (parsed.updatedAt) {
        localMetaRef.current = {
          updatedAt: parsed.updatedAt,
          isDirty: Boolean(parsed.isDirty),
        };
      }
    } catch {
      // ignore
    } finally {
      draftLoadedRef.current = true;
    }
  }, [storageKey]);

  const loadFromServer = useCallback(
    (payload: DraftState, updatedAt: number) => {
      setState(payload);
      setIsDirty(false);
      localMetaRef.current = { updatedAt, isDirty: false };
    },
    [],
  );

  useEffect(() => {
    const payload = {
      state,
      isDirty,
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    localMetaRef.current = { updatedAt: payload.updatedAt, isDirty };
  }, [state, isDirty, storageKey]);

  const markDirty = useCallback((updater: (prev: DraftState) => DraftState) => {
    setIsDirty(true);
    setState((prev) => updater(prev));
  }, []);

  const setTitle = useCallback(
    (value: string) => markDirty((prev) => ({ ...prev, title: value })),
    [markDirty],
  );

  const setMarkdown = useCallback(
    (value: string) => markDirty((prev) => ({ ...prev, markdown: value })),
    [markDirty],
  );

  const setTags = useCallback(
    (tags: string[]) => markDirty((prev) => ({ ...prev, tags })),
    [markDirty],
  );

  const setIsPublic = useCallback(
    (value: boolean) => markDirty((prev) => ({ ...prev, isPublic: value })),
    [markDirty],
  );

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    localMetaRef.current = { updatedAt: Date.now(), isDirty: false };
    setIsDirty(false);
  }, [storageKey]);

  return {
    state,
    setState,
    isDirty,
    setIsDirty,
    setTitle,
    setMarkdown,
    setTags,
    setIsPublic,
    localMetaRef,
    loadFromServer,
    clearDraft,
  };
}
