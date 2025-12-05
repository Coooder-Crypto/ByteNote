import type { Descendant } from "slate";

export const DEFAULT_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] } as unknown as Descendant,
];

export const LIST_TYPES = ["numbered-list", "bulleted-list"];

export function toPlainText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node)) return node.map((n) => toPlainText(n)).join("");
  if (Array.isArray(node.children))
    return node.children.map((n: any) => toPlainText(n)).join("");
  if (Array.isArray(node.content))
    return node.content.map((n: any) => toPlainText(n)).join("");
  if (typeof node === "object")
    return Object.values(node)
      .map((v) => toPlainText(v))
      .join("");
  return "";
}

export function normalizeDescendants(input: any): Descendant[] {
  if (!input) return DEFAULT_VALUE;
  if (!Array.isArray(input)) {
    const text = toPlainText(input);
    return [
      { type: "paragraph", children: [{ text }] } as unknown as Descendant,
    ];
  }

  const normalizeNode = (node: any): any => {
    if (typeof node?.text === "string") {
      return { text: node.text };
    }
    const type = typeof node?.type === "string" ? node.type : "paragraph";
    const childrenRaw = Array.isArray(node?.children) ? node.children : [];
    const children =
      childrenRaw.length > 0
        ? childrenRaw.map((c: any) => normalizeNode(c))
        : [{ text: "" }];
    return { type, children };
  };

  const cleaned = input.map((n) => normalizeNode(n));
  return cleaned.length > 0 ? (cleaned as Descendant[]) : DEFAULT_VALUE;
}
