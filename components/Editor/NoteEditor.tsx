"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MarkdownEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui";
import { useNoteActions } from "@/hooks";
import useEditorPersistence from "@/hooks/Common/useEditorPersistence";
import EditorManager, { type EditorNote } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";

export default function NoteEditor({ noteId }: { noteId: string }) {
  const { meQuery, noteQuery, setNoteDetailCache } = useNoteActions({
    noteId,
    withQueries: !isLocalId(noteId),
  });

  const manager = useMemo(
    () => new EditorManager(noteId, meQuery?.data?.id),
    [noteId, meQuery?.data?.id],
  );

  const [noteState, setNoteState] = useState<EditorNote>(() =>
    manager.getNote(),
  );

  const { save, saving } = useEditorPersistence(
    noteId,
    manager,
    setNoteDetailCache,
  );

  useEffect(() => {
    setNoteState(manager.hydrate(noteQuery?.data ?? undefined));
  }, [manager, noteQuery?.data]);

  const handleTitleChange = (value: string) =>
    setNoteState(manager.updateTitleAndNote(value));

  const handleTagsChange = (tags: string[]) =>
    setNoteState(manager.updateTagsAndNote(tags));

  const handleContentChange = (markdown: string) =>
    setNoteState(manager.updateMarkdownAndPersist(markdown));

  const handleSave = useCallback(async () => {
    const snap = manager.getNote();
    if (!snap.access.canEdit || snap.access.isTrashed) return;
    setNoteState(manager.persistLocal());
    const offlineNow =
      typeof navigator !== "undefined" ? !navigator.onLine : false;
    if (offlineNow || isLocalId(noteId)) return;
    try {
      await save();
    } catch {}
  }, [manager, noteId, save]);

  // Cmd/Ctrl + S 保存到本地/队列并触发远端保存
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // 每 10 秒自动保存一次到本地/队列；内容未变化时自动跳过
  useEffect(() => {
    const canPersist = () => {
      const current = manager.getNote();
      return current.access.canEdit && !current.access.isTrashed;
    };
    return manager.startAutoPersist(10000, canPersist, setNoteState);
  }, [manager]);

  const titlePlaceholder = useMemo(
    () => (noteState.access.canEdit ? "输入标题" : "无权限编辑"),
    [noteState.access.canEdit],
  );

  const { canEdit, isTrashed } = noteState.access;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {canEdit ? (
            <input
              className="bg-card text-lg font-semibold outline-none"
              value={noteState.title}
              placeholder={titlePlaceholder}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit || isTrashed}
            />
          ) : (
            <h2 className="text-lg font-semibold">
              {noteState.title || "笔记"}
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
            value={noteState.tags}
            onChange={handleTagsChange}
            placeholder="添加标签"
            className="w-full"
          />
        ) : (
          <NoteTags tags={noteState.tags} />
        )}
      </div>

      <MarkdownEditor
        value={noteState.markdown}
        onChange={(val) => handleContentChange(val)}
        readOnly={!canEdit || isTrashed}
        placeholder="开始记录你的想法..."
      />
    </div>
  );
}
