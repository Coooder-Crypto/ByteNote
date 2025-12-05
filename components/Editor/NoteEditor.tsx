"use client";

import { useMemo } from "react";
import type { Descendant } from "slate";

import { PlateEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui";
import useEditor from "@/hooks/editor/useEditor";

const EMPTY_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] } as unknown as Descendant,
];

export default function NoteEditor({ noteId }: { noteId: string }) {
  const {
    note,
    saving,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
  } = useEditor(noteId);

  const { canEdit, isTrashed } = note.access;
  const titlePlaceholder = useMemo(
    () => (note.access.canEdit ? "输入标题" : "无权限编辑"),
    [note.access.canEdit],
  );

  const value = useMemo(() => {
    const content = (note.contentJson as Descendant[]) ?? [];
    if (Array.isArray(content) && content.length > 0) return content;
    return EMPTY_VALUE;
  }, [note.contentJson]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {canEdit ? (
            <input
              className="bg-card text-lg font-semibold outline-none"
              value={note.title}
              placeholder={titlePlaceholder}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit || isTrashed}
            />
          ) : (
            <h2 className="text-lg font-semibold">{note.title || "笔记"}</h2>
          )}
          <div className="text-muted-foreground text-xs">
            {isTrashed
              ? "该笔记已在回收站，恢复后才能编辑。"
              : canEdit
                ? "可编辑"
                : "仅作者或协作者可编辑"}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={!canEdit || isTrashed || saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        )}
      </div>

      <div>
        {canEdit ? (
          <TagInput
            value={note.tags}
            onChange={handleTagsChange}
            placeholder="添加标签"
            className="w-full"
          />
        ) : (
          <NoteTags tags={note.tags} />
        )}
      </div>

      <div className="border-border/60 bg-card/80 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-xs">
            {canEdit ? "实时编辑" : "内容"}
          </span>
        </div>
        <div className="px-3 py-3">
          <PlateEditor
            value={value}
            onChange={(val) => handleContentChange(val as Descendant[])}
            readOnly={!canEdit || isTrashed}
            placeholder="开始输入..."
          />
        </div>
      </div>
    </div>
  );
}
