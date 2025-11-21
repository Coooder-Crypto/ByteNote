import { Plus } from "lucide-react";

import { FolderItem } from "./FolderItem";

type FolderInfo = {
  label: string;
  count: number;
  color: string;
};

type SideFoldersProps = {
  folders: FolderInfo[];
};

export function SideFolders({ folders }: SideFoldersProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
          分组
        </p>
        <button className="text-muted-foreground hover:bg-muted rounded-md p-1">
          <Plus className="size-3" />
        </button>
      </div>
      <div className="mt-1 space-y-1">
        {folders.map((folder) => (
          <FolderItem key={folder.label} folder={folder} />
        ))}
      </div>
    </div>
  );
}
