import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BnNav } from "@/types";

type LibraryItemProps = {
  item: BnNav;
  active: boolean;
  onNavigate?: () => void;
};

export function LibraryItem({ item, active, onNavigate }: LibraryItemProps) {
  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon
          className={cn(
            "size-4 transition-colors",
            active ? "text-primary" : "text-muted-foreground",
          )}
        />
        {item.label}
      </div>
    </Link>
  );
}
