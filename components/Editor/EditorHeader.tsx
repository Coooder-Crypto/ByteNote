import { useMemo } from "react";

import { EditorState } from "@/hooks";

import { Button } from "../ui/button";

type HeaderProps = {
  state: EditorState;
  canEdit: boolean;
  isOwner: boolean;
  isTrashed: boolean;
  isSaving: boolean;
  favoritePending: boolean;
  deletePending: boolean;
  restorePending: boolean;
  destroyPending: boolean;
  onFavorite: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onDestroy: () => void;
  onOpenCollab: () => void;
};

export default function NoteHeader({
  state,
  canEdit,
  isOwner,
  isTrashed,
  isSaving,
  favoritePending,
  deletePending,
  restorePending,
  destroyPending,
  onFavorite,

  onSave,
  onDelete,
  onRestore,
  onDestroy,
  onOpenCollab,
}: HeaderProps) {
  const statusText = useMemo(() => {
    if (isTrashed) return "笔记已在回收站中";
    return canEdit ? "你可以编辑这篇笔记" : "此笔记为只读";
  }, [canEdit, isTrashed]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold">{state.title || "笔记详情"}</h2>
        <p className="text-muted-foreground text-sm">{statusText}</p>
      </div>
      {canEdit && (
        <div className="flex gap-2">
          {!isTrashed ? (
            <>
              <Button
                variant={state.isFavorite ? "secondary" : "outline"}
                onClick={onFavorite}
                disabled={favoritePending || !isOwner}
              >
                {favoritePending
                  ? "更新中..."
                  : state.isFavorite
                    ? "取消收藏"
                    : "收藏"}
              </Button>
              <Button variant="outline" onClick={onSave} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
              {isOwner && (
                <>
                  <Button
                    variant="destructive"
                    onClick={onDelete}
                    disabled={deletePending}
                  >
                    移至回收站
                  </Button>
                  <Button variant="ghost" onClick={onOpenCollab}>
                    协作者
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={onRestore}
                    disabled={restorePending}
                  >
                    {restorePending ? "恢复中..." : "恢复笔记"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onDestroy}
                    disabled={destroyPending}
                  >
                    {destroyPending ? "删除中..." : "彻底删除"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
