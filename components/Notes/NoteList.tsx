"use client";

import { BnNote } from "@/types";

import NoteCard from "./NoteCard";

type NoteListProps = {
  notes: BnNote[];
  sortKey: "updatedAt" | "createdAt";
  emptyMessage?: string;
  onSelect?: (id: string) => void;
};

export default function NoteList({
  notes,
  sortKey,
  emptyMessage = "暂无笔记",
  onSelect,
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
        <NoteCard
          key={note.id}
          note={note}
          sortKey={sortKey}
          onLocalSelect={onSelect}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
