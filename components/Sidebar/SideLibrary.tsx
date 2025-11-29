import type { BnNav } from "@/types/entities";

import { LibraryItem } from "./LibraryItem";

type SideLibraryProps = {
  items: BnNav[];
  currentPath: string;
  onNavigate?: () => void;
};

export default function SideLibrary({
  items,
  currentPath,
  onNavigate,
}: SideLibraryProps) {
  const normalize = (path: string) =>
    path.startsWith("/") ? path : `/${path}`;
  const isActive = (path: string) => {
    const normalized = normalize(path);
    const [targetPath, targetQuery] = normalized.split("?");
    const [currentBase, currentQuery] = currentPath.split("?");
    if (currentBase !== targetPath) {
      return false;
    }
    if (!targetQuery) {
      return !currentQuery;
    }
    return (currentQuery ?? "").startsWith(targetQuery);
  };

  return (
    <div>
      <p className="text-muted-foreground mb-2 px-2 text-[11px] font-semibold tracking-[0.2em] uppercase">
        库
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <LibraryItem
            key={item.path}
            item={item}
            active={isActive(item.path)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
