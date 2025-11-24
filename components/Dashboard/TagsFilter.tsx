"use client";

type TagsFilterProps = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
};

export default function TagsFilter({
  tags,
  selected,
  onToggle,
}: TagsFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}
