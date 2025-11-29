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
