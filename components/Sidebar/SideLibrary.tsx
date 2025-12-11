import type { BnNav } from "@/types";

import NavItem from "./NavItem";

type SideLibraryProps = {
  items: BnNav[];
  currentPath: string;
  onNavigate?: () => void;
  collapsed?: boolean;
};

export default function SideLibrary({
  items,
  currentPath,
  onNavigate,
  collapsed = false,
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
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem
            key={item.path}
            href={item.path}
            label={item.label}
            icon={item.icon}
            active={isActive(item.path)}
            collapsed={collapsed}
            className={collapsed ? "justify-center" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
