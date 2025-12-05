import { computeAccess } from "@/lib/noteAccess";

import { isLocalId } from "./offline/ids";
import { parseStoredTags } from "./tags";

export type EditorNote = {
  title: string;
  contentJson: any;
  collabWsUrl?: string | null;
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
  contentJson: any;
  collabWsUrl?: string | null;
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
      contentJson: [
        {
          type: "paragraph",
          children: [{ text: "" }],
        },
      ],
      collabWsUrl: null,
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
    const contentJson = this.normalizeContent(note.contentJson);
    this.state = {
      title: note.title,
      contentJson,
      collabWsUrl: (note as any).collabWsUrl ?? null,
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

  updateContentJson(contentJson: any) {
    this.state = { ...this.state, contentJson };
  }

  updateContentAndNote(contentJson: any): EditorNote {
    this.updateContentJson(contentJson);
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

  private normalizeContent(raw: any): any[] {
    if (Array.isArray(raw) && raw.length > 0) return raw as any[];
    const text = this.extractText(raw);
    return [
      {
        type: "paragraph",
        children: [{ text }],
      },
    ];
  }

  private extractText(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node)) return node.map((n) => this.extractText(n)).join("");
    if (Array.isArray(node.children))
      return node.children.map((n: any) => this.extractText(n)).join("");
    if (Array.isArray(node.content))
      return node.content.map((n: any) => this.extractText(n)).join("");
    if (typeof node === "object")
      return Object.values(node).map((v) => this.extractText(v)).join("");
    return "";
  }
}

export default EditorManager;
