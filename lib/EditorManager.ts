import { computeAccess } from "@/lib/noteAccess";

import { isLocalId } from "./offline/ids";
import { noteStorage, queueStorage } from "./offline/note-storage";
import { parseStoredTags } from "./tags";

export type EditorNote = {
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

export type ServerNotePayload = {
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
};

export class EditorManager {
  private noteId: string;
  private state: EditorNote;

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

  hydrate(note?: ServerNotePayload): EditorNote {
    if (note) {
      this.setFromServer(note);
    } else if (isLocalId(this.noteId)) {
      this.setLocalEditable();
    }
    return this.getNote();
  }

  setFromServer(note: ServerNotePayload) {
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

  updateTitleAndNote(title: string): EditorNote {
    this.updateTitle(title);
    return this.getNote();
  }

  updateTags(tags: string[]) {
    this.state = { ...this.state, tags };
  }

  updateTagsAndNote(tags: string[]): EditorNote {
    this.updateTags(tags);
    return this.getNote();
  }

  updateMarkdown(markdown: string) {
    this.state = { ...this.state, markdown };
  }

  updateMarkdownAndNote(markdown: string): EditorNote {
    this.updateMarkdown(markdown);
    return this.getNote();
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

  updateAccess(partial: Partial<EditorNote["access"]>) {
    this.state = {
      ...this.state,
      access: { ...this.state.access, ...partial },
    };
  }

  getNote(): EditorNote {
    return this.state;
  }

  private parseTags(raw: string | string[]): string[] {
    return parseStoredTags(raw);
  }
}

export default EditorManager;
