"use client";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Save,
  StretchHorizontal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Button } from "@/components/ui";

import type { ToolbarActions } from "./slate/Toolbar";

const SlateToolbar = dynamic(
  () => import("./slate/Toolbar").then((m) => m.SlateToolbar),
  {
    ssr: false,
    loading: () => null,
  },
);

type EditorHeaderProps = {
  isCollaborative: boolean;
  collabEnabled: boolean;
  collabStatus?: "connecting" | "connected" | "error" | "idle";
  isTrashed: boolean;
  canEdit: boolean;
  charCount: number;
  saving?: boolean;
  folderLabel?: string;
  currentUser?: { name?: string | null; avatarUrl?: string | null };
  collaborators?: { name?: string | null; avatarUrl?: string | null }[];
  onBack?: () => void;
  onSave: () => void;
  onManageCollaborators: () => void;
  onToggleCollab?: () => void;
  toolbarActions?: ToolbarActions;
  wide?: boolean;
  onToggleWidth?: () => void;
  previewMode?: boolean;
  onTogglePreview?: () => void;
  onRequestDelete?: () => void;
  deleting?: boolean;
};

export default function EditorHeader({
  isCollaborative,
  collabEnabled,
  collabStatus = "idle",
  isTrashed,
  canEdit,
  charCount,
  saving,
  folderLabel = "Notes",
  currentUser,
  collaborators = [],
  onBack,
  onSave,
  onManageCollaborators,
  onToggleCollab,
  toolbarActions,
  wide = false,
  onToggleWidth,
  previewMode = false,
  onTogglePreview,
  onRequestDelete,
  deleting = false,
}: EditorHeaderProps) {
  const connected =
    collabStatus === "connected" || (collabEnabled && collabStatus === "idle");

  return (
    <div className="bg-card/80 flex w-full flex-col shadow-sm">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 overflow-hidden">
          {onBack && (
            <>
              <Button
                onClick={onBack}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                title="Back to List"
              >
                <ArrowLeft size={16} />
              </Button>
              <div className="bg-border/80 h-4 w-px" />
            </>
          )}
          <div className="text-foreground flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase">
              {folderLabel}
            </span>
            <span>•</span>
            {isCollaborative && onToggleCollab ? (
              <Button
                onClick={onToggleCollab}
                variant="ghost"
                size="sm"
                className={`px-2 py-1 text-[11px] ${connected ? "text-emerald-600" : "text-rose-500"}`}
              >
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? "Connected" : "Offline"}
              </Button>
            ) : (
              <span className="text-muted-foreground">Local Draft</span>
            )}
            {isTrashed && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                Trash / Read-only
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">
            {charCount} chars
          </span>
          <div
            className="ml-auto flex -space-x-4"
            onClick={onManageCollaborators}
          >
            {currentUser && (
              <AvatarChip
                key="me"
                src={currentUser.avatarUrl}
                name={currentUser.name ?? "Me"}
                highlight
                zIndex={(collaborators?.length ?? 0) + 2}
              />
            )}
            {collaborators.slice(0, 3).map((c, idx) => (
              <AvatarChip
                key={`${c.name ?? "collab"}-${idx}`}
                src={c.avatarUrl}
                name={c.name ?? "协作者"}
                zIndex={collaborators.length - idx + 1}
              />
            ))}
          </div>
        </div>
      </div>
      {(toolbarActions ||
        onTogglePreview ||
        onRequestDelete ||
        onToggleWidth) && (
        <div className="px-4 pt-0 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {toolbarActions && (
                <SlateToolbar
                  visible
                  disabled={!canEdit || isTrashed || previewMode}
                  actions={toolbarActions}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onTogglePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-border/60"
                  onClick={onTogglePreview}
                  aria-pressed={previewMode}
                  title={previewMode ? "退出预览" : "预览"}
                >
                  {previewMode ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              )}

              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-border/60"
                  onClick={onSave}
                  disabled={isTrashed || saving}
                  title="保存"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                </Button>
              )}

              {onRequestDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={onRequestDelete}
                  disabled={deleting}
                  title="删除"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}

              {onToggleWidth && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-border/60"
                  onClick={onToggleWidth}
                  aria-label="切换编辑区域宽度"
                  title="切换宽度"
                >
                  <StretchHorizontal className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { EditorHeaderProps };

function AvatarChip({
  src,
  name,
  highlight = false,
  zIndex,
}: {
  src?: string | null;
  name: string;
  highlight?: boolean;
  zIndex?: number;
}) {
  const fallback = name?.[0]?.toUpperCase?.() ?? "?";
  return (
    <div
      className={`relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-slate-900 ${highlight ? "ring-primary/60 ring-2" : ""}`}
      title={name}
      style={{ width: 32, height: 32, ...(zIndex ? { zIndex } : {}) }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={32}
          height={32}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-semibold text-slate-700">
          {fallback}
        </span>
      )}
    </div>
  );
}
