"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { isLocalId } from "@/lib/offline/ids";
import { BnNote } from "@/types/entities";

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
  const isTrashed = Boolean(note.deletedAt);
  const summary =
    note.content?.slice(0, 120).replace(/\n+/g, " ").trim() ?? "暂无内容";
  const displayDate = sortKey === "createdAt" ? note.createdAt : note.updatedAt;
  const localOnly = isLocalId(note.id);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => {
        if (onSelect) {
          onSelect(note.id);
        } else if (localOnly && onLocalSelect) {
          onLocalSelect(note.id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (onSelect) {
            onSelect(note.id);
          } else if (localOnly && onLocalSelect) {
            onLocalSelect(note.id);
          }
        }
      }}
      className="group h-full cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{new Date(displayDate).toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
            {localOnly && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700">
                未同步
              </span>
            )}
            {note.isFavorite && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-600">
                收藏
              </span>
            )}
            {isTrashed && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-600">
                回收站
              </span>
            )}
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-snug font-semibold">
          {note.title || "未命名笔记"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground line-clamp-3 text-sm">{summary}</p>
        {note.tags.length > 0 && (
          <div className="text-muted-foreground flex flex-wrap gap-2 text-[11px]">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted/70 text-muted-foreground rounded-full px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
