"use client";

import { ArrowLeft, Save, Sparkles, Wand2, Wifi, WifiOff } from "lucide-react";
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
  onAiSummarize?: () => void;
  onAiEnhance?: () => void;
  summarizing?: boolean;
  enhancing?: boolean;
  aiDisabled?: boolean;
  aiDisabledReason?: string;
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
  onAiSummarize,
  onAiEnhance,
  summarizing,
  enhancing,
  aiDisabled,
  aiDisabledReason,
}: EditorHeaderProps) {
  const connected =
    collabStatus === "connected" || (collabEnabled && collabStatus === "idle");

  return (
    <div className="flex w-full flex-col border border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs text-slate-500 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-3 overflow-hidden">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Back to List"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            </>
          )}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
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
              <span className="text-slate-400">Local Draft</span>
            )}
            {isTrashed && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                Trash / Read-only
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{charCount} chars</span>
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
              {onAiSummarize && (
                <button
                  type="button"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white inline-flex h-8 items-center gap-1 rounded-lg border border-border/60 bg-white px-2.5 text-[11px] font-semibold transition hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800"
                  onClick={onAiSummarize}
                  disabled={aiDisabled || summarizing || isTrashed}
                  title={aiDisabledReason ?? "生成摘要"}
                >
                  <Wand2 className="size-3.5" />
                  {summarizing ? "摘要中..." : "AI 摘要"}
                </button>
              )}
              {onAiEnhance && (
                <button
                  type="button"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white inline-flex h-8 items-center gap-1 rounded-lg border border-border/60 bg-white px-2.5 text-[11px] font-semibold transition hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800"
                  onClick={onAiEnhance}
                  disabled={aiDisabled || enhancing || isTrashed}
                  title={aiDisabledReason ?? "AI 丰富内容"}
                >
                  <Sparkles className="size-3.5" />
                  {enhancing ? "丰富中..." : "AI 丰富"}
                </button>
              )}
              <button
                type="button"
                className="bg-primary hover:bg-primary/90 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
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
