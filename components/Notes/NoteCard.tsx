"use client";

import { Star, Users } from "lucide-react";

import { isLocalId } from "@/lib/utils/offline/ids";
import type { BnNote } from "@/types";

type NoteCardProps = {
  note: BnNote;
  sortKey: "updatedAt" | "createdAt";
  onLocalSelect?: (id: string) => void;
  onSelect?: (id: string) => void;
  offline?: boolean;
};

export default function NoteCard({
  note,
  sortKey,
  onLocalSelect,
  onSelect,
  offline = false,
}: NoteCardProps) {
  const summary =
    note.content?.slice(0, 220).replace(/\n+/g, " ").trim() ??
    "Empty note content...";
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
      className="flex h-64 flex-col bg-card p-5 rounded-2xl border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-bold text-lg text-foreground truncate">
            {note.title || <span className="text-muted-foreground italic">Untitled</span>}
          </h3>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground/90">
            {formatDate(displayDate)}
          </span>
          {note.isFavorite && (
            <Star size={18} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
          )}
        </div>
      </div>

      <p className="flex-1 text-sm text-muted-foreground line-clamp-5 leading-relaxed font-medium">
        {summary || <span className="italic opacity-50">Empty note content...</span>}
      </p>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {note.isCollaborative && (
            <div
              className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20"
              title="Collaborative"
            >
              <Users size={12} />
            </div>
          )}
          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-muted text-foreground/80 rounded-md text-xs font-medium truncate"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{note.tags.length - 2}
            </span>
          )}
          {isOfflineCard && (
            <span className="text-[10px] rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700">
              未同步
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | number | Date) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
