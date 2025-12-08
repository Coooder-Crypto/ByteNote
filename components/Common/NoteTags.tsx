"use client";

import { getTagLabel, parseStoredTags } from "@/lib/constants/tags";

type NoteTagsProps = {
  tags: string | string[] | null | undefined;
};

export default function NoteTags({ tags }: NoteTagsProps) {
  const parsed = parseStoredTags(tags);

  if (parsed.length === 0) {
    return <span className="text-muted-foreground text-xs italic">No tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {parsed.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-lg bg-muted/70 px-2.5 py-1 font-medium text-foreground/80"
        >
          {getTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
