"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MarkdownEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import { TagInput } from "@/components/TagInput";
import { useNoteActions } from "@/hooks";
import EditorManager, { type EditorSnapshot } from "@/lib/EditorManager";
import { isLocalId } from "@/lib/offline/ids";
import { noteStorage, queueStorage } from "@/lib/offline/note-storage";

export default function NoteEditor({ noteId }: { noteId: string }) {
  const { meQuery, noteQuery } = useNoteActions({
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

  useEffect(() => {
    if (noteQuery.data) {
      manager.setFromServer(noteQuery.data);
    } else if (isLocalId(noteId)) {
      manager.setLocalEditable();
    }
    setSnapshot(manager.getSnapshot());
  }, [manager, noteId, noteQuery.data]);

  const handleTitleChange = useCallback(
    (value: string) => {
      manager.updateTitle(value);
      setSnapshot(manager.getSnapshot());
    },
    [manager],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      manager.updateTags(tags);
      setSnapshot(manager.getSnapshot());
    },
    [manager],
  );

  const handleContentChange = useCallback(
    (markdown: string) => {
      manager.updateMarkdown(markdown);
      const next = manager.getSnapshot();
      setSnapshot(next);
      const updatedAt = Date.now();
      const title = next.title || "未命名笔记";
      void noteStorage.save({
        id: noteId,
        title,
        markdown,
        tags: next.tags,
        folderId: next.folderId,
        updatedAt,
        syncStatus: "dirty",
        tempId: isLocalId(noteId) ? noteId : undefined,
      });
      void queueStorage.enqueue({
        noteId,
        action: "update",
        payload: {
          id: noteId,
          title,
          tags: next.tags,
          folderId: next.folderId,
          markdown,
          updatedAt,
          isCollaborative: next.isCollaborative,
        },
        timestamp: updatedAt,
        tempId: isLocalId(noteId) ? noteId : undefined,
      });
    },
    [manager, noteId],
  );

  const titlePlaceholder = useMemo(
    () => (snapshot.access.canEdit ? "输入标题" : "无权限编辑"),
    [snapshot.access.canEdit],
  );

  const { canEdit, isTrashed } = snapshot.access;

  return (
    <div className="space-y-4">
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
          <h2 className="text-lg font-semibold">{snapshot.title || "笔记"}</h2>
        )}
        <div className="text-muted-foreground text-xs">
          {isTrashed
            ? "该笔记已在回收站，恢复后才能编辑。"
            : canEdit
              ? "可编辑"
              : "仅作者或协作者可编辑"}
        </div>
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
