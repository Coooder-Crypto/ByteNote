import { Plus } from "lucide-react";

import type { FolderListItem } from "@/types/entities";

import { FolderItem } from "./FolderItem";

type SideFoldersProps = {
  folders: FolderListItem[];
  activeFolderId: string | null;
  loading?: boolean;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder?: () => void;
};

export default function SideFolders({
  folders,
  activeFolderId,
  loading = false,
  onSelectFolder,
  onCreateFolder,
}: SideFoldersProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
          分组
        </p>
        <button
          className="text-muted-foreground hover:bg-muted rounded-md p-1"
          onClick={onCreateFolder}
          disabled={loading}
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="mt-1 space-y-1">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            active={activeFolderId === folder.id}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
        {folders.length === 0 && (
          <p className="text-muted-foreground rounded-lg px-3 py-2 text-xs">
            还没有分组
          </p>
        )}
      </div>
    </div>
  );
}
