import type { Descendant } from "slate";

import { DEFAULT_VALUE } from "@/lib/constants/editor";
import type { CustomElement, CustomText } from "@/types/editor";

type UnknownNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | { text?: unknown; children?: UnknownNode[]; content?: UnknownNode[] }
  | UnknownNode[];

export function toPlainText(node: UnknownNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) return node.map((n) => toPlainText(n)).join("");
  if (typeof node === "object") {
    const candidate = node as { text?: unknown; children?: UnknownNode[]; content?: UnknownNode[] };
    if (typeof candidate.text === "string") return candidate.text;
    if (Array.isArray(candidate.children))
      return candidate.children.map((n) => toPlainText(n)).join("");
    if (Array.isArray(candidate.content))
      return candidate.content.map((n) => toPlainText(n)).join("");
    return Object.values(candidate)
      .map((v) => toPlainText(v as UnknownNode))
      .join("");
  }
  return "";
}

export function normalizeDescendants(input: unknown): Descendant[] {
  if (!input) return DEFAULT_VALUE;
  if (!Array.isArray(input)) {
    const text = toPlainText(input as UnknownNode);
    return [
      { type: "paragraph", children: [{ text }] } satisfies CustomElement,
    ];
  }

  const normalizeNode = (node: UnknownNode): CustomElement | CustomText => {
    const n = node as Partial<CustomElement & CustomText>;
    if (typeof n.text === "string") {
      return { text: n.text } satisfies CustomText;
    }
    const type =
      typeof (n as any)?.type === "string" ? (n as any).type : "paragraph";
    const childrenRaw = Array.isArray((n as any)?.children)
      ? ((n as any).children as UnknownNode[])
      : [];
    const children =
      childrenRaw.length > 0
        ? childrenRaw.map((c) => normalizeNode(c))
        : [{ text: "" } satisfies CustomText];
    return { type, children } as CustomElement;
  };

  const cleaned = (input as UnknownNode[]).map((n) => normalizeNode(n));
  return cleaned.length > 0 ? (cleaned as Descendant[]) : DEFAULT_VALUE;
}
