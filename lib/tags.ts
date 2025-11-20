export const NOTE_TAGS = [
  { value: "frontend", label: "前端基础" },
  { value: "nextjs", label: "Next.js" },
  { value: "ui", label: "UI / 设计" },
  { value: "ai", label: "AI 应用" },
  { value: "llm", label: "大模型" },
] as const;

const TAG_LABEL_MAP = NOTE_TAGS.reduce<Record<string, string>>((acc, tag) => {
  acc[tag.value] = tag.label;
  return acc;
}, {});

export const getTagLabel = (value: string) => TAG_LABEL_MAP[value] ?? value;

export const parseStoredTags = (
  value: string | string[] | null | undefined,
): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (tag): tag is string =>
        typeof tag === "string" && tag.trim().length > 0,
    );
  }

  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (tag): tag is string =>
            typeof tag === "string" && tag.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
};
