import { useCallback } from "react";
import {
  Editor,
  Element as SlateElement,
  Path,
  Range,
  Transforms,
} from "slate";

import { LIST_TYPES } from "@/lib/constants/editor";
import type { CustomElement, CustomText } from "@/types/editor";

function moveCursorToBlockStart(editor: Editor) {
  try {
    const entry = Editor.above(editor, {
      match: (n) => Editor.isBlock(editor, n as SlateElement),
    });
    if (!entry) return;
    const [, path] = entry;
    const firstChildPath = path.concat(0);
    try {
      const firstChild = Editor.node(editor, firstChildPath)[0] as CustomText;
      if (!firstChild || firstChild.text === undefined) {
        Transforms.insertNodes(
          editor,
          { text: "" },
          {
            at: firstChildPath,
          },
        );
      }
    } catch {
      Transforms.insertNodes(
        editor,
        { text: "" },
        {
          at: firstChildPath,
        },
      );
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
    match: (n) => Editor.isBlock(editor, n as SlateElement),
  });
  if (!blockEntry) return false;

  const [, path] = blockEntry;
  const text = Editor.string(editor, path);
  const before = text.slice(0, selection.anchor.offset);
  const trimmed = before.trim();

  const convert = (type: CustomElement["type"]) => {
    event.preventDefault();
    Transforms.delete(editor, {
      at: { anchor: Editor.start(editor, path), focus: selection.anchor },
    });
    if (LIST_TYPES.includes(type)) {
      toggleBlock(editor, type);
    } else {
      Transforms.setNodes(editor, { type } as Partial<CustomElement>, {
        at: path,
      });
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
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  const active = marks ? marks[format] === true : false;
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
        (n as CustomElement).type === format,
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
      LIST_TYPES.includes((n as CustomElement).type as string),
    split: true,
  });

  const newType = isActive ? "paragraph" : isList ? "list-item" : format;
  Transforms.setNodes(editor, { type: newType } as Partial<CustomElement>);

  if (!isActive && isList) {
    const emptyText: CustomText = { text: "" };
    const listItem: CustomElement = {
      type: "list-item",
      children: [emptyText],
    };
    const block: CustomElement =
      format === "bulleted-list"
        ? { type: "bulleted-list", children: [listItem] }
        : { type: "numbered-list", children: [listItem] };
    Transforms.wrapNodes(editor, block);
  }
  moveCursorToBlockStart(editor);
}

export default function useShortcuts(editor: Editor) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (handleMarkdownShortcut(editor, event)) return;

      if (event.key === "Enter" && !event.shiftKey) {
        const codeEntry = Editor.above(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            (n as CustomElement).type === "code-block",
        });
        if (codeEntry) {
          event.preventDefault();
          Transforms.insertText(editor, "\n");
          return;
        }

        const headingEntry = Editor.above(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            ((n as CustomElement).type === "heading-one" ||
              (n as CustomElement).type === "heading-two"),
        });
        const { selection } = editor;
        if (headingEntry && selection) {
          event.preventDefault();
          const [, path] = headingEntry;
          const insertPath = Path.next(path);
          Transforms.insertNodes(
            editor,
            {
              type: "paragraph",
              children: [{ text: "" }],
            } as CustomElement,
            {
              at: insertPath,
            },
          );
          Transforms.select(editor, Editor.start(editor, insertPath));
          return;
        }
      }

      if (event.key === "Backspace") {
        const { selection } = editor;
        if (selection && Range.isCollapsed(selection)) {
          const convertToParagraph = (path: Path) => {
            Transforms.setNodes(
              editor,
              { type: "paragraph" } as Partial<CustomElement>,
              { at: path },
            );
            Transforms.unwrapNodes(editor, {
              at: path,
              match: (n) =>
                SlateElement.isElement(n) &&
                (["block-quote"] as string[]).includes(
                  (n as CustomElement).type as string,
                ),
              split: true,
            });
            try {
              Transforms.select(editor, Editor.start(editor, path));
            } catch {
              /* ignore */
            }
          };
          const convertCodeToParagraph = (path: Path) => {
            try {
              const paragraph: CustomElement = {
                type: "paragraph",
                children: [{ text: "" }],
              };
              Transforms.removeNodes(editor, { at: path });
              Transforms.insertNodes(editor, paragraph, { at: path });
              Transforms.select(editor, Editor.start(editor, path));
            } catch {
              /* ignore */
            }
          };

          const convertSingleCodeToParagraphInline = (path: Path) => {
            try {
              Transforms.setNodes(
                editor,
                { type: "paragraph" } as Partial<CustomElement>,
                { at: path },
              );
              const node = Editor.node(editor, path)[0] as CustomElement;
              if (
                SlateElement.isElement(node) &&
                (!Array.isArray(node.children) || node.children.length === 0)
              ) {
                Transforms.insertNodes(
                  editor,
                  { text: "" },
                  { at: path.concat(0) },
                );
              }
              Transforms.select(editor, Editor.start(editor, path));
            } catch {
              /* ignore */
            }
          };

          const listItemEntry = Editor.above(editor, {
            match: (n) =>
              SlateElement.isElement(n) &&
              (n as CustomElement).type === "list-item",
          });
          const listParentEntry = Editor.above(editor, {
            match: (n) =>
              SlateElement.isElement(n) &&
              LIST_TYPES.includes((n as CustomElement).type as string),
          });

          if (listItemEntry) {
            const [, itemPath] = listItemEntry;
            const text = Editor.string(editor, itemPath);
            const atStart = selection.anchor.offset === 0;
            const singleItemList =
              listParentEntry &&
              Array.isArray((listParentEntry[0] as CustomElement).children) &&
              (listParentEntry[0] as CustomElement).children.length <= 1;

            if (text.length === 0) {
              event.preventDefault();
              Transforms.setNodes(
                editor,
                { type: "paragraph" } as Partial<CustomElement>,
                {
                  at: itemPath,
                },
              );
              Transforms.unwrapNodes(editor, {
                at: itemPath,
                match: (n) =>
                  SlateElement.isElement(n) &&
                  LIST_TYPES.includes((n as CustomElement).type as string),
                split: true,
              });
              try {
                Transforms.select(editor, Editor.start(editor, itemPath));
              } catch {
                /* ignore */
              }
              return;
            }

            if (atStart && singleItemList) {
              event.preventDefault();
              Transforms.setNodes(
                editor,
                { type: "paragraph" } as Partial<CustomElement>,
                {
                  at: itemPath,
                },
              );
              Transforms.unwrapNodes(editor, {
                at: itemPath,
                match: (n) =>
                  SlateElement.isElement(n) &&
                  LIST_TYPES.includes((n as CustomElement).type as string),
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
              Transforms.setNodes(
                editor,
                { type: "paragraph" } as Partial<CustomElement>,
                {
                  at: listPath,
                  match: (n) =>
                    SlateElement.isElement(n) &&
                    (n as CustomElement).type === "list-item",
                },
              );
              Transforms.unwrapNodes(editor, {
                at: listPath,
                match: (n) =>
                  SlateElement.isElement(n) &&
                  LIST_TYPES.includes((n as CustomElement).type as string),
                split: true,
              });
              moveCursorToBlockStart(editor);
              return;
            }
          } else {
            const quoteEntry = Editor.above(editor, {
              match: (n) =>
                SlateElement.isElement(n) &&
                (n as CustomElement).type === "block-quote",
            });
            if (quoteEntry) {
              const [, path] = quoteEntry;
              const text = Editor.string(editor, path);
              if (text.length === 0) {
                event.preventDefault();
                convertToParagraph(path);
                return;
              }
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
        const marks = Editor.marks(editor) as Record<string, unknown> | null;
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
