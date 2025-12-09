export const MARK_KEYS = ["bold", "italic", "underline", "code"] as const;

export const BLOCK_CONFIGS = [
  { key: "h1", type: "heading-one" as const },
  { key: "h2", type: "heading-two" as const },
  { key: "bullet", type: "bulleted-list" as const },
  { key: "ordered", type: "numbered-list" as const },
  { key: "quote", type: "block-quote" as const },
  { key: "codeBlock", type: "code-block" as const },
] as const;
