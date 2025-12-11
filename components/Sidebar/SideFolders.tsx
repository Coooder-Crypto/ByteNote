import { Plus } from "lucide-react";

import { Button } from "@/components/ui";
import type { BnFolder } from "@/types";

import FolderItem from "./FolderItem";

type SideFoldersProps = {
  folders: BnFolder[];
  activeFolderId: string | null;
  loading?: boolean;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder?: () => void;
  collapsed?: boolean;
};

export default function SideFolders({
  folders,
  activeFolderId,
  loading = false,
  onSelectFolder,
  onCreateFolder,
  collapsed = false,
}: SideFoldersProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onCreateFolder}
          disabled={loading}
          aria-label="新建分组"
        >
          <Plus className="size-3" />
        </Button>
      </div>
      <div className="mt-1 space-y-1">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            active={activeFolderId === folder.id}
            collapsed={collapsed}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
      </div>
    </div>
  );
}
