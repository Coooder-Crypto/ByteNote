"use client";

export function NoteTags({ tags }: { tags: string | null | undefined }) {
  let parsed: string[] = [];
  try {
    const candidate = JSON.parse(tags ?? "[]");
    parsed = Array.isArray(candidate)
      ? candidate.filter((tag) => typeof tag === "string" && tag.trim())
      : [];
  } catch {
    parsed = [];
  }

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
          {tag}
        </span>
      ))}
    </div>
  );
}
