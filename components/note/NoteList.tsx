"use client";

import { memo, useEffect, useMemo, useRef } from "react";

import { Skeleton } from "@/components/ui";
import type { BnNote } from "@/types";

import NoteCard from "./NoteCard";

type NoteListProps = {
  notes: BnNote[];
  sortKey: "updatedAt" | "createdAt";
  emptyMessage?: string;
  onSelect?: (id: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onEndReached?: () => void;
};

function NoteListComponent({
  notes,
  sortKey,
  emptyMessage = "暂无笔记",
  onSelect,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onEndReached,
}: NoteListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const showSkeleton = loading && notes.length === 0;
  const gridClass =
    "grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  useEffect(() => {
    if (!hasMore || !onEndReached) return;
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore) {
          onEndReached();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onEndReached]);

  const skeletons = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="border-border/60 bg-muted/50 rounded-2xl border p-4"
        >
          <Skeleton className="mb-3 h-5 w-2/3" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="mb-2 h-3 w-11/12" />
          <Skeleton className="mb-2 h-3 w-10/12" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
      )),
    [],
  );

  if (showSkeleton) {
    return <div className={gridClass}>{skeletons}</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="border-border/70 text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          sortKey={sortKey}
          onLocalSelect={onSelect}
          onSelect={onSelect}
        />
      ))}

      {hasMore && (
        <div className="col-span-full flex flex-col items-center gap-2 py-2">
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
          {loadingMore && (
            <div className="text-muted-foreground text-xs">加载中...</div>
          )}
        </div>
      )}
    </div>
  );
}

const NoteList = memo(NoteListComponent);

export default NoteList;
