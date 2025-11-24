"use client";

import NoteCard from "./NoteCard";

type DashboardNote = {
  id: string;
  title: string;
  content: string | null;
  updatedAt: string;
  tags: string[];
};

type NoteListProps = {
  notes: DashboardNote[];
  emptyMessage?: string;
};

export default function NoteList({
  notes,
  emptyMessage = "暂无笔记",
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="border-border/70 text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
