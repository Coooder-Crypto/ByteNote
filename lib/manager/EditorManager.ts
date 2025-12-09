import { toPlainText, type UnknownNode } from "@/components/Editor/slate/normalize";
import { parseStoredTags } from "@/lib/constants/tags";
import { isLocalId } from "@/lib/utils/offline/ids";
import type {
  AccessInput,
  AccessResult,
  AiMeta,
  ContentJson,
  EditorNote,
  ServerNotePayload,
} from "@/types";

function computeAccess({
  note,
  currentUserId,
  localOnly,
}: AccessInput): AccessResult {
  if (localOnly) {
    return {
      isOwner: true,
      isCollaborator: false,
      canEdit: true,
      isTrashed: false,
    };
  }

  const isOwner =
    typeof currentUserId === "string" && note.userId === currentUserId;
  const isCollaborator = Boolean(
    currentUserId &&
    note.collaborators?.some((item) => item.userId === currentUserId),
  );
  const isTrashed = Boolean(note.deletedAt);
  const canEdit = !isTrashed && (isOwner || isCollaborator);

  return { isOwner, isCollaborator, canEdit, isTrashed };
}

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
      summary: "",
      aiMeta: undefined,
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
    const collabWs =
      typeof (note as { collabWsUrl?: unknown }).collabWsUrl === "string"
        ? (note as { collabWsUrl?: string }).collabWsUrl
        : null;
    const summary =
      typeof (note as { summary?: unknown }).summary === "string"
        ? (note as { summary: string }).summary
        : "";
    const aiMeta =
      (note as { aiMeta?: unknown }).aiMeta &&
      typeof (note as { aiMeta?: unknown }).aiMeta === "object"
        ? ((note as { aiMeta?: AiMeta }).aiMeta as AiMeta)
        : undefined;

    this.state = {
      title: note.title,
      contentJson,
      collabWsUrl: collabWs,
      tags: parsedTags,
      isCollaborative: note.isCollaborative,
      folderId: note.folderId,
      isFavorite: note.isFavorite,
      version: typeof note.version === "number" ? note.version : 1,
      summary,
      aiMeta,
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

  updateCollaborative(enabled: boolean) {
    this.state = { ...this.state, isCollaborative: enabled };
  }

  updateCollaborativeAndNote(enabled: boolean): EditorNote {
    this.updateCollaborative(enabled);
    return this.getNote();
  }

  updateContentJson(contentJson: ContentJson) {
    this.state = { ...this.state, contentJson };
  }

  updateContentAndNote(contentJson: ContentJson): EditorNote {
    this.updateContentJson(contentJson);
    return this.getNote();
  }

  updateVersion(version: number) {
    this.state = { ...this.state, version };
  }

  updateVersionAndNote(version: number): EditorNote {
    this.updateVersion(version);
    return this.getNote();
  }

  updateCollabWsUrl(collabWsUrl: string | null) {
    this.state = { ...this.state, collabWsUrl };
  }

  updateSummary(summary: string) {
    this.state = { ...this.state, summary };
  }

  updateSummaryAndNote(summary: string): EditorNote {
    this.updateSummary(summary);
    return this.getNote();
  }

  updateAiMeta(aiMeta: AiMeta | undefined) {
    this.state = { ...this.state, aiMeta };
  }

  updateFavorite(isFavorite: boolean) {
    this.state = { ...this.state, isFavorite };
  }

  updateFolder(folderId: string | null) {
    this.state = { ...this.state, folderId };
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

  private normalizeContent(raw: unknown): ContentJson {
    if (Array.isArray(raw) && raw.length > 0) return raw as ContentJson;
    const text = toPlainText(raw as UnknownNode);
    return [
      {
        type: "paragraph",
        children: [{ text }],
      },
    ] as ContentJson;
  }
}

export default EditorManager;
