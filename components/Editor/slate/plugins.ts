import {
  Editor,
  Element as SlateElement,
  Path,
  Range,
  Transforms,
} from "slate";

import { parseMarkdown } from "@/lib/editor/markdown";
import type { CustomElement } from "@/types/editor";

export const withMarkdownPaste = (editor: Editor) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[bn][markdown-paste] plugin applied");
  }
  const { insertData } = editor;
  editor.insertData = (data) => {
    const text = data.getData("text/plain");
    if (process.env.NODE_ENV !== "production") {
      try {
        const html = data.getData("text/html");
        // Helpful to inspect what the clipboard actually contains.
        console.log("[bn][markdown-paste] text/plain:", text);
        if (html) console.log("[bn][markdown-paste] text/html:", html);
      } catch (err) {
        console.log("[bn][markdown-paste] read clipboard failed", err);
      }
    }
    if (text) {
      const fragment = parseMarkdown(text);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[bn][markdown-paste] parsed fragment length:",
          fragment.length,
          fragment,
        );
      }
      if (fragment.length) {
        Transforms.insertFragment(editor, fragment);
        return;
      }
    }
    insertData(data);
  };
  return editor;
};

export const withCustomDelete = (editor: Editor) => {
  const { deleteBackward } = editor;
  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const codeEntry = Editor.above(editor, {
        match: (n) =>
          SlateElement.isElement(n) &&
          (n as { type?: string }).type === "code-block",
      });
      if (codeEntry) {
        const [, path] = codeEntry;
        const text = Editor.string(editor, path);
        const isEmpty = text.trim().length === 0;
        const atStart = Editor.isStart(editor, selection.anchor, path);
        const anchorOffset = selection.anchor.offset;
        const prevChar = anchorOffset > 0 ? text[anchorOffset - 1] : "";

        if (isEmpty) {
          Transforms.setNodes(
            editor,
            { type: "paragraph" } as Partial<CustomElement>,
            { at: path },
          );
          const node = Editor.node(editor, path)[0] as any;
          if (!node.children || node.children.length === 0) {
            Transforms.insertNodes(
              editor,
              { text: "" },
              { at: path.concat(0) },
            );
          }
          Transforms.select(editor, Editor.start(editor, path));
          return;
        }

        if (prevChar === "\n") {
          const range = {
            anchor: { path: selection.anchor.path, offset: anchorOffset - 1 },
            focus: selection.anchor,
          };
          Transforms.delete(editor, { at: range as any });
          const insertPath = Path.next(path);
          Transforms.insertNodes(
            editor,
            { type: "paragraph", children: [{ text: "" }] } as any,
            { at: insertPath },
          );
          Transforms.select(editor, Editor.start(editor, insertPath));
          return;
        }

        if (atStart) {
          Transforms.insertNodes(
            editor,
            { type: "paragraph", children: [{ text: "" }] } as any,
            { at: path },
          );
          Transforms.select(editor, Editor.start(editor, path));
          return;
        }
      }
    }
    deleteBackward(unit);
  };
  return editor;
};
