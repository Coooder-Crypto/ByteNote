export type BnFolder = {
  id: string;
  label: string;
  count?: number;
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
  markdown: string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[] | BnTag[];
  isCollaborative?: boolean;
};
