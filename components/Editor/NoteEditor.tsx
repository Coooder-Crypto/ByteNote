"use client";

import { useEffect, useMemo, useState } from "react";

import { MarkdownEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui";
import { useNoteActions } from "@/hooks";
import useEditorPersistence from "@/hooks/Common/useEditorPersistence";
import EditorManager, { type EditorSnapshot } from "@/lib/EditorManager";

export default function NoteEditor({ noteId }: { noteId: string }) {
  const { meQuery, noteQuery, setNoteDetailCache } = useNoteActions({
    noteId,
    withQueries: true,
  });

  const manager = useMemo(
    () => new EditorManager(noteId, meQuery?.data?.id),
    [noteId, meQuery?.data?.id],
  );
  const [snapshot, setSnapshot] = useState<EditorSnapshot>(() =>
    manager.getSnapshot(),
  );

  const { save, saving } = useEditorPersistence(
    noteId,
    manager,
    setNoteDetailCache,
  );

  useEffect(() => {
    setSnapshot(manager.hydrate(noteQuery.data));
  }, [manager, noteQuery.data]);

  const handleTitleChange = (value: string) =>
    setSnapshot(manager.updateTitleAndSnapshot(value));

  const handleTagsChange = (tags: string[]) =>
    setSnapshot(manager.updateTagsAndSnapshot(tags));

  const handleContentChange = (markdown: string) =>
    setSnapshot(manager.updateMarkdownAndPersist(markdown));

  const handleSave = async () => {
    const snap = manager.getSnapshot();
    if (!snap.access.canEdit || snap.access.isTrashed) return;
    try {
      await save();
    } catch {}
  };

  const titlePlaceholder = useMemo(
    () => (snapshot.access.canEdit ? "输入标题" : "无权限编辑"),
    [snapshot.access.canEdit],
  );

  const { canEdit, isTrashed } = snapshot.access;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {canEdit ? (
            <input
              className="bg-card text-lg font-semibold outline-none"
              value={snapshot.title}
              placeholder={titlePlaceholder}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit || isTrashed}
            />
          ) : (
            <h2 className="text-lg font-semibold">
              {snapshot.title || "笔记"}
            </h2>
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
            value={snapshot.tags}
            onChange={handleTagsChange}
            placeholder="添加标签"
            className="w-full"
          />
        ) : (
          <NoteTags tags={snapshot.tags} />
        )}
      </div>

      <MarkdownEditor
        value={snapshot.markdown}
        onChange={(val) => handleContentChange(val)}
        readOnly={!canEdit || isTrashed}
        placeholder="开始记录你的想法..."
      />
    </div>
  );
}
