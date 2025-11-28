"use client";

import { useRouter } from "next/navigation";

type DashboardNote = {
  id: string;
  title: string;
  content: string | null;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
};

type NoteCardProps = {
  note: DashboardNote;
};

export default function NoteCard({ note }: NoteCardProps) {
  const router = useRouter();
  const isTrashed = Boolean(note.deletedAt);
  const summary =
    note.content?.slice(0, 120).replace(/\n+/g, " ").trim() ?? "暂无内容";

  return (
    <button
      onClick={() => router.push(`/notes/${note.id}`)}
      className="group border-border/70 bg-card/80 hover:border-primary/50 flex h-full flex-col rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-2">
          {note.isFavorite && (
            <span className="text-amber-600 bg-amber-50 border-amber-200 rounded-full border px-2 py-0.5">
              收藏
            </span>
          )}
          {isTrashed && (
            <span className="text-rose-600 bg-rose-50 border-rose-200 rounded-full border px-2 py-0.5">
              回收站
            </span>
          )}
        </div>
      </div>
      <h3 className="text-foreground line-clamp-2 text-lg font-semibold">
        {note.title || "未命名笔记"}
      </h3>
      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
        {summary}
      </p>
      {note.tags.length > 0 && (
        <div className="text-muted-foreground mt-4 flex flex-wrap gap-2 text-[11px]">
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
    </button>
  );
}
