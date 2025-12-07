export type BnFolder = {
  id: string;
  name: string;
  noteCount?: number;
};

export type BnUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type BnNav = {
  icon: import("lucide-react").LucideIcon;
  label: string;
  path: string;
};

export type BnTag = {
  id?: string;
  label: string;
  value: string;
};

export type BnNote = {
  id: string;
  title: string;
  content?: string | null;
  contentJson?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
  isCollaborative?: boolean;
};

export type EditorState = {
  title: string;
  contentJson: any;
  isFavorite: boolean;
  isCollaborative: boolean;
  folderId: string | null;
  tags: string[];
  version: number;
};

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

export type Theme = "light" | "dark";

export type AccessInput = {
  note: {
    userId?: string | null;
    collaborators?: { userId: string }[];
    deletedAt?: string | Date | null;
    isCollaborative?: boolean;
    folderId?: string | null;
  };
  currentUserId?: string;
  localOnly?: boolean;
};

export type AccessResult = {
  isOwner: boolean;
  isCollaborator: boolean;
  canEdit: boolean;
  isTrashed: boolean;
};

export type LocalNoteRecord = {
  id: string;
  title: string;
  contentJson: unknown;
  tags: string[];
  folderId: string | null;
  updatedAt: number;
  deleted?: boolean;
  tempId?: string;
  syncStatus?: "dirty" | "synced" | "pending";
  isCollaborative?: boolean;
  version?: number;
};
