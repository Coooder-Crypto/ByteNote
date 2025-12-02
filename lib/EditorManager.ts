import { computeAccess } from "@/lib/noteAccess";

import { isLocalId } from "./offline/ids";
import { parseStoredTags } from "./tags";

export type EditorSnapshot = {
  title: string;
  markdown: string;
  tags: string[];
  isCollaborative: boolean;
  folderId: string | null;
  isFavorite: boolean;
  version: number;
  access: {
    canEdit: boolean;
    isTrashed: boolean;
    isOwner: boolean;
    isCollaborator: boolean;
  };
};

export class EditorManager {
  private noteId: string;
  private state: EditorSnapshot;

  constructor(
    noteId: string,
    private currentUserId?: string,
  ) {
    this.noteId = noteId;
    this.state = {
      title: "",
      markdown: "",
      tags: [],
      isCollaborative: false,
      folderId: null,
      isFavorite: false,
      version: 1,
      access: {
        canEdit: isLocalId(noteId),
        isTrashed: false,
        isOwner: true,
        isCollaborator: false,
      },
    };
  }

  setFromServer(note: {
    title: string;
    markdown: string;
    tags: string | string[];
    isCollaborative: boolean;
    folderId: string | null;
    isFavorite: boolean;
    version?: number;
    deletedAt?: string | Date | null;
    userId?: string | null;
    collaborators?: { userId: string }[];
  }) {
    const parsedTags = this.parseTags(note.tags);
    const access = computeAccess({
      note: {
        userId: note.userId,
        collaborators: note.collaborators,
        deletedAt: note.deletedAt,
        folderId: note.folderId,
        isCollaborative: note.isCollaborative,
      },
      currentUserId: this.currentUserId,
      localOnly: isLocalId(this.noteId),
    });
    this.state = {
      title: note.title,
      markdown: note.markdown,
      tags: parsedTags,
      isCollaborative: note.isCollaborative,
      folderId: note.folderId,
      isFavorite: note.isFavorite,
      version: typeof note.version === "number" ? note.version : 1,
      access: {
        canEdit: access.canEdit,
        isTrashed: access.isTrashed,
        isOwner: access.isOwner,
        isCollaborator: access.isCollaborator,
      },
    };
  }

  setLocalEditable() {
    this.state = {
      ...this.state,
      access: {
        ...this.state.access,
        canEdit: true,
        isTrashed: false,
        isOwner: true,
        isCollaborator: false,
      },
    };
  }

  updateTitle(title: string) {
    this.state = { ...this.state, title };
  }

  updateTags(tags: string[]) {
    this.state = { ...this.state, tags };
  }

  updateMarkdown(markdown: string) {
    this.state = { ...this.state, markdown };
  }

  updateFavorite(isFavorite: boolean) {
    this.state = { ...this.state, isFavorite };
  }

  updateFolder(folderId: string | null) {
    this.state = { ...this.state, folderId };
  }

  updateCollaborative(isCollaborative: boolean) {
    this.state = { ...this.state, isCollaborative };
  }

  updateAccess(partial: Partial<EditorSnapshot["access"]>) {
    this.state = {
      ...this.state,
      access: { ...this.state.access, ...partial },
    };
  }

  getSnapshot(): EditorSnapshot {
    return this.state;
  }

  private parseTags(raw: string | string[]): string[] {
    return parseStoredTags(raw);
  }
}

export default EditorManager;
