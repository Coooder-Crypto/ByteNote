"use client";

import { create } from "zustand";

import type { BnFolder, EditorState } from "@/types/entities";

const emptyState: EditorState = {
  title: "",
  markdown: "",
  isFavorite: false,
  isCollaborative: false,
  folderId: null,
  tags: [],
  version: 1,
};

type NotePayload = {
  title: string;
  markdown: string;
  isFavorite: boolean;
  isCollaborative: boolean;
  folderId: string | null;
  version: number;
  tags: string;
  userId: string;
  collaborators?: { userId: string }[];
  deletedAt?: string | Date | null;
};

type NoteStore = {
  state: EditorState;
  isDirty: boolean;
  collabOpen: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
  canEdit: boolean;
  isTrashed: boolean;
  folders?: BnFolder[];
  setFromNote: (note: NotePayload, currentUserId?: string) => void;
  setTitle: (title: string) => void;
  setTags: (tags: string[]) => void;
  setFolder: (folderId: string | null) => void;
  setCollaborative: (val: boolean) => void;
  setContent: (markdown: string) => void;
  setDirty: (dirty: boolean) => void;
  setCollabOpen: (open: boolean) => void;
  setFolders: (folders?: BnFolder[]) => void;
  updateState: (updater: (prev: EditorState) => EditorState) => void;
};

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (tag): tag is string =>
            typeof tag === "string" && tag.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
};

const useNoteStore = create<NoteStore>((set) => ({
  state: emptyState,
  isDirty: false,
  collabOpen: false,
  isOwner: false,
  isCollaborator: false,
  canEdit: false,
  isTrashed: false,
  folders: undefined,

  setFromNote: (note, currentUserId) => {
    const isOwner = currentUserId === note.userId;
    const isCollaborator = Boolean(
      note.isCollaborative &&
        note.collaborators?.some((c) => c.userId === currentUserId),
    );
    set({
      state: {
        title: note.title,
        markdown: note.markdown,
        isFavorite: note.isFavorite,
        isCollaborative: note.isCollaborative,
        folderId: note.folderId,
        tags: parseTags(note.tags),
        version: note.version,
      },
      isDirty: false,
      isOwner,
      isCollaborator,
      canEdit: isOwner || isCollaborator,
      isTrashed: Boolean(note.deletedAt),
    });
  },

  setTitle: (title) =>
    set((prev) => ({
      state: { ...prev.state, title },
      isDirty: true,
    })),

  setTags: (tags) =>
    set((prev) => ({
      state: { ...prev.state, tags },
      isDirty: true,
    })),

  setFolder: (folderId) =>
    set((prev) => ({
      state: { ...prev.state, folderId },
      isDirty: true,
    })),

  setCollaborative: (val) =>
    set((prev) => ({
      state: { ...prev.state, isCollaborative: val },
      isDirty: true,
    })),

  setContent: (markdown) =>
    set((prev) => ({
      state: { ...prev.state, markdown },
      isDirty: true,
    })),

  setDirty: (dirty) => set({ isDirty: dirty }),

  setCollabOpen: (open) => set({ collabOpen: open }),

  setFolders: (folders) => set({ folders }),

  updateState: (updater) =>
    set((prev) => ({
      state: updater(prev.state),
    })),
}));

export default useNoteStore;
