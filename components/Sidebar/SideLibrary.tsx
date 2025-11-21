import { type LucideIcon } from "lucide-react";

import { LibraryItem } from "./LibraryItem";

type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

type SideLibraryProps = {
  items: NavItem[];
  pathname: string | null;
  onNavigate?: () => void;
};

export function SideLibrary({ items, pathname, onNavigate }: SideLibraryProps) {
  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "?");

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
