import { Folder } from "lucide-react";

import { Button } from "@/components/ui";
import type { BnFolder } from "@/types";

type FolderItemProps = {
  folder: BnFolder;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
};

export default function FolderItem({
  folder,
  active = false,
  collapsed = false,
  onClick,
}: FolderItemProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="group w-full justify-between px-3 py-2 text-left text-sm"
      aria-pressed={active}
    >
      <div className="flex items-center gap-3">
        <Folder
          size={16}
          className={active ? "text-primary" : "text-muted-foreground"}
        />
        {!collapsed && (
          <span className={active ? "text-foreground font-medium" : undefined}>
            {folder.name}
          </span>
        )}
      </div>
      {!collapsed && <span className="text-[10px]">{folder.noteCount}</span>}
    </Button>
  );
}
