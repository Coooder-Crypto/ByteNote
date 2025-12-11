"use client";

import { Star, Users } from "lucide-react";
import { memo, useMemo } from "react";

import { isLocalId } from "@/lib/utils/offline/ids";
import type { BnNote } from "@/types";

type NoteCardProps = {
  note: BnNote;
  sortKey: "updatedAt" | "createdAt";
  onLocalSelect?: (id: string) => void;
  onSelect?: (id: string) => void;
  offline?: boolean;
};

function NoteCardComponent({
  note,
  sortKey,
  onLocalSelect,
  onSelect,
  offline = false,
}: NoteCardProps) {
  const summary = useMemo(
    () =>
      note.summary?.trim() && note.summary.trim().length > 0
        ? note.summary.trim()
        : (note.content?.slice(0, 220).replace(/\n+/g, " ").trim() ??
          "Empty note content..."),
    [note.content, note.summary],
  );
  const displayDate = sortKey === "createdAt" ? note.createdAt : note.updatedAt;
  const localOnly = isLocalId(note.id);
  const isOfflineCard = offline || localOnly;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(note.id);
    } else if (localOnly && onLocalSelect) {
      onLocalSelect(note.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
      className="bg-card border-border/60 hover:border-primary/50 group relative flex h-64 cursor-pointer flex-col overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <h3 className="text-foreground truncate text-lg font-bold">
            {note.title || (
              <span className="text-muted-foreground italic">Untitled</span>
            )}
          </h3>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <span className="text-muted-foreground/90 text-[11px] font-semibold">
            {formatDate(displayDate)}
          </span>
          {note.isFavorite && (
            <Star
              size={18}
              className="mt-0.5 shrink-0 fill-amber-400 text-amber-400"
            />
          )}
        </div>
      </div>

      <p className="text-muted-foreground line-clamp-5 flex-1 text-sm leading-relaxed font-medium">
        {summary || (
          <span className="italic opacity-50">Empty note content...</span>
        )}
      </p>

      <div className="border-border/50 mt-4 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {note.isCollaborative && (
            <div
              className="bg-primary/10 text-primary border-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
              title="Collaborative"
            >
              <Users size={12} />
            </div>
          )}
          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-muted text-foreground/80 truncate rounded-md px-2 py-1 text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-muted-foreground text-xs">
              +{note.tags.length - 2}
            </span>
          )}
          {isOfflineCard && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
              未同步
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const NoteCard = memo(NoteCardComponent);

export default NoteCard;

function formatDate(dateStr: string | number | Date) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
