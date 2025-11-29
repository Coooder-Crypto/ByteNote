"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardNote = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
};

type NoteCardProps = {
  note: DashboardNote;
  sortKey: "updatedAt" | "createdAt";
};

export default function NoteCard({ note, sortKey }: NoteCardProps) {
  const router = useRouter();
  const isTrashed = Boolean(note.deletedAt);
  const summary =
    note.content?.slice(0, 120).replace(/\n+/g, " ").trim() ?? "暂无内容";
  const displayDate =
    sortKey === "createdAt" ? note.createdAt : note.updatedAt;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/notes/${note.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/notes/${note.id}`);
        }
      }}
      className="group h-full cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{new Date(displayDate).toLocaleDateString()}</span>
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
        <CardTitle className="text-lg font-semibold leading-snug line-clamp-2">
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
