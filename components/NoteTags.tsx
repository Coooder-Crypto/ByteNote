"use client";

import { getTagLabel, parseStoredTags } from "@/lib/tags";

type NoteTagsProps = {
  tags: string | string[] | null | undefined;
};

export function NoteTags({ tags }: NoteTagsProps) {
  const parsed = parseStoredTags(tags);

  if (parsed.length === 0) {
    return <span className="text-xs text-muted-foreground">标签：无</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 text-xs">
      <span className="text-muted-foreground">标签：</span>
      {parsed.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border px-2 py-0.5 text-foreground"
        >
          {getTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
