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
  markdown: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
  isCollaborative?: boolean;
};
