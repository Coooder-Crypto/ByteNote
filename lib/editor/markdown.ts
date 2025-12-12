import type { Descendant } from "slate";

type ListType = "bulleted-list" | "numbered-list";

export function parseMarkdown(text: string): Descendant[] {
  const normalizedText = text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u00a0/g, " ");
  const lines = normalizedText.split("\n");
  const nodes: Descendant[] = [];
  const listStack: Array<{ type: ListType; children: any[] }> = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushCode = () => {
    nodes.push({
      type: "code-block",
      children: [{ text: codeLines.join("\n") || "" }],
    } as any);
    codeLines = [];
    inCode = false;
  };

  const resetLists = () => {
    listStack.length = 0;
  };

  const ensureList = (depth: number, type: ListType) => {
    // trim deeper stacks when indentation decreases (keep current depth)
    while (listStack.length > depth + 1) {
      listStack.pop();
    }

    const existing = listStack[depth];
    if (existing && existing.type === type) {
      return existing;
    }

    const newList = { type, children: [] };
    if (depth === 0) {
      nodes.push(newList);
    } else {
      const parentList = listStack[depth - 1];
      if (parentList) {
        let lastItem = parentList.children[parentList.children.length - 1];
        if (!lastItem || (lastItem as any).type !== "list-item") {
          lastItem = {
            type: "list-item",
            children: [
              {
                type: "paragraph",
                children: [{ text: "" }],
              },
            ],
          };
          parentList.children.push(lastItem);
        }
        if (!Array.isArray((lastItem as any).children)) {
          (lastItem as any).children = [];
        }
        (lastItem as any).children.push(newList);
      }
    }

    listStack[depth] = newList;
    listStack.length = depth + 1;
    return newList;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        resetLists();
        inCode = true;
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "") {
      if (listStack.length > 0) {
        // blank line inside a list: end nested lists but keep outer list
        listStack.length = 1;
        continue;
      }
      resetLists();
      nodes.push({
        type: "paragraph",
        children: [{ text: "" }],
      } as any);
      continue;
    }

    const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
    const depth = Math.floor(indent / 2);
    const heading1 = trimmed.match(/^#\s+(.+)/);
    const heading2 = trimmed.match(/^##\s+(.+)/);
    const quote = trimmed.match(/^>\s+(.+)/);
    const bullet = trimmed.match(/^[-*+]\s+(.+)/);
    const ordered = trimmed.match(/^(\d+)[.)]\s+(.+)/);

    if (heading1) {
      resetLists();
      nodes.push({
        type: "heading-one",
        children: [{ text: heading1[1] }],
      } as any);
      continue;
    }
    if (heading2) {
      resetLists();
      nodes.push({
        type: "heading-two",
        children: [{ text: heading2[1] }],
      } as any);
      continue;
    }
    if (quote) {
      resetLists();
      nodes.push({
        type: "block-quote",
        children: [{ text: quote[1] }],
      } as any);
      continue;
    }

    if (bullet || ordered) {
      const type: ListType = bullet ? "bulleted-list" : "numbered-list";
      const textContent = bullet ? bullet[1] : ordered![2];
      const targetDepth =
        depth > 0 && listStack.length === 0
          ? 0
          : Math.min(depth, listStack.length || depth);
      const list = ensureList(targetDepth, type);
      list.children.push({
        type: "list-item",
        children: [
          {
            type: "paragraph",
            children: [{ text: textContent }],
          },
        ],
      });
      continue;
    }

    resetLists();
    nodes.push({
      type: "paragraph",
      children: [{ text: line }],
    } as any);
  }

  if (inCode) flushCode();
  resetLists();
  return nodes;
}
