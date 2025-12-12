"use client";

import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotesTagsProps = {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags?: () => void;
};

function NotesTagsComponent({
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: NotesTagsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-2">
      <span className="text-muted-foreground mr-1 text-xs font-bold uppercase">
        Tags:
      </span>
      {tags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <Button
            key={tag}
            onClick={() => onToggleTag(tag)}
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-medium",
              active && "shadow-md shadow-primary/20",
            )}
          >
            #{tag}
          </Button>
        );
      })}
      {selectedTags.length > 0 && (
        <Button
          onClick={() => onClearTags?.()}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:decoration-destructive ml-1 shrink-0 px-2 text-xs underline decoration-slate-300"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

const NotesTags = memo(NotesTagsComponent);

export default NotesTags;
