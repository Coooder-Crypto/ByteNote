"use client";

import { ArrowLeft, Save, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";

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
}: EditorHeaderProps) {
  const connected =
    collabStatus === "connected" || (collabEnabled && collabStatus === "idle");

  return (
    <div className="border-border/70 bg-card/60 flex w-full flex-col rounded-lg border">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 overflow-hidden">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="text-muted-foreground hover:bg-muted/60 rounded-full p-1 transition-colors"
                title="Back to List"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="bg-border/80 h-4 w-px" />
            </>
          )}
          <div className="text-foreground/80 flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase">
              {folderLabel}
            </span>
            <span>•</span>
            {isCollaborative && onToggleCollab ? (
              <button
                onClick={onToggleCollab}
                className={`flex items-center gap-1 ${connected ? "text-emerald-600" : "text-rose-500"}`}
              >
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? "Connected" : "Offline"}
              </button>
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
          <span className="text-muted-foreground">{charCount} chars</span>
          <div className="flex -space-x-4" onClick={onManageCollaborators}>
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

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="bg-card/80 border-border/60 text-foreground hover:border-primary inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                onClick={onSave}
                disabled={isTrashed || saving}
              >
                <Save className="size-4" />
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-slate-900 ${highlight ? "ring-primary/60 ring-2" : ""}`}
      title={name}
      style={zIndex ? { zIndex } : undefined}
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
