import { EditorState } from "@/hooks/useNoteStore";
import { BnFolder } from "@/types/entities";

import { TagInput } from "../TagInput";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type MetaFormProps = {
  state: EditorState;
  isOwner: boolean;
  canEdit: boolean;
  isTrashed: boolean;
  folders?: BnFolder[];
  folderPending: boolean;
  onTitleChange: (val: string) => void;
  onTagsChange: (tags: string[]) => void;
  onFolderChange: (folderId: string | null) => void;
  onCollaborativeToggle: (val: boolean) => void;
};

export default function NoteMetaForm({
  state,
  isOwner,
  canEdit,
  isTrashed,
  folders,
  folderPending,
  onTitleChange,
  onTagsChange,
  onFolderChange,
  onCollaborativeToggle,
}: MetaFormProps) {
  return (
    <>
      <Input
        value={state.title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="输入标题"
        disabled={!canEdit}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2 lg:max-w-2xl">
          <p className="text-muted-foreground text-xs">标签（可输入或选择）</p>
          <TagInput
            value={state.tags}
            onChange={onTagsChange}
            placeholder="输入标签或从列表选择"
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">分组</p>
          <Select
            value={state.folderId ?? "none"}
            onValueChange={(value) => {
              const nextFolderId = value === "none" ? null : value;
              onFolderChange(nextFolderId);
            }}
            disabled={folderPending || isTrashed || !isOwner || !canEdit}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择分组" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分组</SelectItem>
              {folders?.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <input
              id="collab"
              type="checkbox"
              checked={state.isCollaborative}
              onChange={(event) => onCollaborativeToggle(event.target.checked)}
              disabled={isTrashed || !isOwner}
            />
            <label htmlFor="collab" className="text-muted-foreground text-sm">
              协作笔记
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
