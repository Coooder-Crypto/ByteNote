import { Folder } from "lucide-react";

type FolderInfo = {
  label: string;
  count: number;
  color: string;
};

type FolderItemProps = {
  folder: FolderInfo;
};

export function FolderItem({ folder }: FolderItemProps) {
  return (
    <div className="group text-muted-foreground hover:bg-muted/60 hover:text-foreground flex items-center justify-between rounded-lg px-3 py-2 text-sm transition">
      <div className="flex items-center gap-3">
        <Folder size={16} className={folder.color} />
        <span>{folder.label}</span>
      </div>
      <span className="text-[10px]">{folder.count}</span>
    </div>
  );
}
