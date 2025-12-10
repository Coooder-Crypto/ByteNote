import { Folder } from "lucide-react";

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
    <button
      onClick={onClick}
      className="group text-muted-foreground hover:bg-muted/60 hover:text-foreground flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition"
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
    </button>
  );
}
