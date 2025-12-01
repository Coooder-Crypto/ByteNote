import { Layout, Star, Trash2, Users } from "lucide-react";

export const NAV_ITEMS = [
  { icon: Layout, label: "所有笔记", path: "/notes" },
  { icon: Star, label: "收藏", path: "/notes?filter=favorite" },
  { icon: Users, label: "协作笔记", path: "/notes?filter=collab" },
  { icon: Trash2, label: "回收站", path: "/notes?filter=trash" },
];
