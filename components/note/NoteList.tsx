"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useMemo, useRef } from "react";

import type { BnNote } from "@/types";

import NoteCard from "./NoteCard";

type NoteListProps = {
  notes: BnNote[];
  sortKey: "updatedAt" | "createdAt";
  emptyMessage?: string;
  onSelect?: (id: string) => void;
};

function NoteListComponent({
  notes,
  sortKey,
  emptyMessage = "暂无笔记",
  onSelect,
}: NoteListProps) {
  const items = useMemo(() => notes, [notes]);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 270,
    overscan: 4,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const fallbackItems =
    virtualItems.length === 0 && items.length > 0 ? items.slice(0, 6) : [];
  const showSkeleton =
    items.length === 0 &&
    virtualItems.length === 0 &&
    fallbackItems.length === 0;

  if (items.length === 0) {
    return (
      <div className="border-border/70 text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[80vh] min-h-[70vh] w-full overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${
            rowVirtualizer.getTotalSize() ||
            (fallbackItems.length || showSkeleton ? 840 : 0)
          }px`,
          position: "relative",
        }}
      >
        {fallbackItems.length > 0 && (
          <div className="absolute top-0 left-0 w-full space-y-4 px-[2px] sm:px-1">
            {fallbackItems.map((note) => (
              <NoteCard
                key={`fallback-${note.id}`}
                note={note}
                sortKey={sortKey}
                onLocalSelect={onSelect}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}

        {showSkeleton &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="absolute top-0 left-0 w-full px-[2px] sm:px-1"
              style={{ transform: `translateY(${idx * 280}px)` }}
            >
              <div className="border-border/60 bg-muted/50 animate-pulse rounded-2xl border p-5">
                <div className="bg-muted-foreground/20 mb-4 h-5 w-2/3 rounded" />
                <div className="bg-muted-foreground/15 mb-2 h-3 w-full rounded" />
                <div className="bg-muted-foreground/15 mb-2 h-3 w-11/12 rounded" />
                <div className="bg-muted-foreground/15 mb-2 h-3 w-10/12 rounded" />
                <div className="bg-muted-foreground/20 mt-4 h-4 w-24 rounded" />
              </div>
            </div>
          ))}

        {virtualItems.map((virtualRow) => {
          const note = items[virtualRow.index];
          if (!note) return null;
          return (
            <div
              key={note.id}
              className="absolute top-0 left-0 w-full px-[2px] sm:px-1"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <NoteCard
                note={note}
                sortKey={sortKey}
                onLocalSelect={onSelect}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NoteList = memo(NoteListComponent);

export default NoteList;
