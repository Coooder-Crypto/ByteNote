"use client";

import { useMemo } from "react";

import { MarkdownEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui";
import useEditor from "@/hooks/editor/useEditor";

export default function NoteEditor({ noteId }: { noteId: string }) {
  const {
    note,
    saving,
    handleTitleChange,
    handleTagsChange,
    handleContentChange,
    handleSave,
  } = useEditor(noteId);

  const titlePlaceholder = useMemo(
    () => (note.access.canEdit ? "输入标题" : "无权限编辑"),
    [note.access.canEdit],
  );

  const { canEdit, isTrashed } = note.access;

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
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!canEdit || isTrashed || saving}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
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

      <MarkdownEditor
        value={note.markdown}
        onChange={(val) => handleContentChange(val)}
        readOnly={!canEdit || isTrashed}
        placeholder="开始记录你的想法..."
      />
    </div>
  );
}
