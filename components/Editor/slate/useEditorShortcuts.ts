import { useCallback } from "react";
import { Editor, Element as SlateElement, Path, Range, Transforms } from "slate";

import { LIST_TYPES } from "./normalize";

function moveCursorToBlockStart(editor: Editor) {
  try {
    const entry = Editor.above(editor, {
      match: (n) => Editor.isBlock(editor, n as any),
    });
    if (!entry) return;
    const [, path] = entry;
    const firstChildPath = path.concat(0);
    try {
      const firstChild = Editor.node(editor, firstChildPath)[0] as any;
      if (!firstChild || (firstChild as any).text === undefined) {
        Transforms.insertNodes(editor, { text: "" } as any, {
          at: firstChildPath,
        });
      }
    } catch {
      Transforms.insertNodes(editor, { text: "" } as any, {
        at: firstChildPath,
      });
    }
    const point = Editor.start(editor, firstChildPath);
    Transforms.select(editor, point);
  } catch {
    // ignore selection errors
  }
}

function handleMarkdownShortcut(editor: Editor, event: React.KeyboardEvent) {
  if (event.key !== " " || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;

  const blockEntry = Editor.above(editor, {
    match: (n) => Editor.isBlock(editor, n as any),
  });
  if (!blockEntry) return false;

  const [, path] = blockEntry;
  const text = Editor.string(editor, path);
  const before = text.slice(0, selection.anchor.offset);
  const trimmed = before.trim();

  const convert = (type: any) => {
    event.preventDefault();
    Transforms.delete(editor, {
      at: { anchor: Editor.start(editor, path), focus: selection.anchor },
    });
    if (LIST_TYPES.includes(type)) {
      toggleBlock(editor, type);
    } else {
      Transforms.setNodes(editor, { type } as any, { at: path });
    }
    moveCursorToBlockStart(editor);
    return true;
  };

  switch (trimmed) {
    case "#":
      return convert("heading-one");
    case "##":
      return convert("heading-two");
    case "-":
    case "*":
      return convert("bulleted-list");
    case "1.":
      return convert("numbered-list");
    case ">":
      return convert("block-quote");
    case "```":
      return convert("code-block");
    default:
      return false;
  }
}

function toggleMark(editor: Editor, format: string) {
  if (!editor.selection) return;
  const active = Editor.marks(editor)?.[format] === true;
  if (active) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function isBlockActive(editor: Editor, format: string) {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as any).type === format,
    }),
  );
  return Boolean(match);
}

function toggleBlock(editor: Editor, format: string) {
  if (!editor.selection) return;
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as any).type as string),
    split: true,
  });

  const newType = isActive ? "paragraph" : isList ? "list-item" : format;
  Transforms.setNodes(editor, { type: newType } as any);

  if (!isActive && isList) {
    const block: SlateElement = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
  moveCursorToBlockStart(editor);
}

export function useEditorShortcuts(editor: Editor) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (handleMarkdownShortcut(editor, event)) return;

      if (event.key === "Enter" && !event.shiftKey) {
        const headingEntry = Editor.above(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            ((n as any).type === "heading-one" ||
              (n as any).type === "heading-two"),
        });
        const { selection } = editor;
        if (headingEntry && selection) {
          event.preventDefault();
          const [, path] = headingEntry;
          const insertPath = Path.next(path);
          Transforms.insertNodes(
            editor,
            { type: "paragraph", children: [{ text: "" }] } as any,
            { at: insertPath },
          );
          Transforms.select(editor, Editor.start(editor, insertPath));
          return;
        }
      }

      if (event.key === "Backspace") {
        const { selection } = editor;
        if (selection && Range.isCollapsed(selection)) {
          const listItemEntry = Editor.above(editor, {
            match: (n) =>
              SlateElement.isElement(n) && (n as any).type === "list-item",
          });
          const listParentEntry = Editor.above(editor, {
            match: (n) =>
              SlateElement.isElement(n) &&
              LIST_TYPES.includes((n as any).type as string),
          });

          if (listItemEntry) {
            const [, itemPath] = listItemEntry;
            const text = Editor.string(editor, itemPath);
            const atStart = selection.anchor.offset === 0;
            const singleItemList =
              listParentEntry &&
              Array.isArray((listParentEntry[0] as any).children) &&
              (listParentEntry[0] as any).children.length <= 1;

            if (text.length === 0) {
              event.preventDefault();
              const listHasMultiple =
                listParentEntry &&
                Array.isArray((listParentEntry[0] as any).children) &&
                (listParentEntry[0] as any).children.length > 1;

              if (listHasMultiple) {
                let targetPath: Path | null = null;
                try {
                  targetPath = Path.previous(itemPath);
                } catch {
                  targetPath = null;
                }
                Transforms.removeNodes(editor, { at: itemPath });
                const fallbackPath = targetPath ?? itemPath;
                try {
                  Transforms.select(editor, Editor.end(editor, fallbackPath));
                } catch {
                  /* ignore */
                }
              } else {
                Transforms.setNodes(editor, { type: "paragraph" } as any, {
                  at: itemPath,
                });
                Transforms.unwrapNodes(editor, {
                  at: itemPath,
                  match: (n) =>
                    SlateElement.isElement(n) &&
                    LIST_TYPES.includes((n as any).type as string),
                  split: true,
                });
                moveCursorToBlockStart(editor);
              }
              return;
            }

            if (atStart && singleItemList) {
              event.preventDefault();
              Transforms.setNodes(editor, { type: "paragraph" } as any, {
                at: itemPath,
              });
              Transforms.unwrapNodes(editor, {
                at: itemPath,
                match: (n) =>
                  SlateElement.isElement(n) &&
                  LIST_TYPES.includes((n as any).type as string),
                split: true,
              });
              moveCursorToBlockStart(editor);
              return;
            }
          } else if (listParentEntry) {
            const [, listPath] = listParentEntry;
            const text = Editor.string(editor, listPath);
            if (text.length === 0) {
              event.preventDefault();
              Transforms.setNodes(editor, { type: "paragraph" } as any, {
                at: listPath,
                match: (n) =>
                  SlateElement.isElement(n) && (n as any).type === "list-item",
              });
              Transforms.unwrapNodes(editor, {
                at: listPath,
                match: (n) =>
                  SlateElement.isElement(n) &&
                  LIST_TYPES.includes((n as any).type as string),
                split: true,
              });
              moveCursorToBlockStart(editor);
              return;
            }
          }
        }
      }

      if (!event.ctrlKey && !event.metaKey) return;
      switch (event.key.toLowerCase()) {
        case "b":
          event.preventDefault();
          toggleMark(editor, "bold");
          break;
        case "i":
          event.preventDefault();
          toggleMark(editor, "italic");
          break;
        case "u":
          event.preventDefault();
          toggleMark(editor, "underline");
          break;
        case "`":
          event.preventDefault();
          toggleMark(editor, "code");
          break;
        default:
          break;
      }
    },
    [editor],
  );

  return {
    handleKeyDown,
    isMarkActive: (format: string) => {
      try {
        const sel = editor.selection;
        if (!sel) return false;
        const marks = Editor.marks(editor);
        return marks ? marks[format] === true : false;
      } catch {
        return false;
      }
    },
    isBlockActive: (format: string) => isBlockActive(editor, format),
    toggleMark: (format: string) => toggleMark(editor, format),
    toggleBlock: (format: string) => toggleBlock(editor, format),
  };
}
