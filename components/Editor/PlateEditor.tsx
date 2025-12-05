"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { BaseText, Descendant } from "slate";
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Node,
  Path,
  Range,
  Text,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";

type CustomText = BaseText & {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "block-quote"
    | "code-block";
  children: CustomText[];
};

type PlateEditorProps = {
  value: Descendant[];
  onChange: (val: Descendant[]) => void;
  readOnly?: boolean;
  placeholder?: string;
};

const DEFAULT_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] } as unknown as Descendant,
];

const LIST_TYPES = ["numbered-list", "bulleted-list"];

function getMarksSafe(editor: Editor) {
  const sel = editor.selection;
  if (!sel || !Range.isCollapsed(sel)) return null;
  try {
    const anchorNode = Node.get(editor, sel.anchor.path);
    if (!Text.isText(anchorNode)) return null;
  } catch {
    return null;
  }
  try {
    return Editor.marks(editor);
  } catch {
    return null;
  }
}

function isMarkActive(editor: Editor, format: keyof CustomText) {
  const marks = getMarksSafe(editor);
  return marks ? (marks as any)[format] === true : false;
}

function moveCursorToBlockStart(editor: Editor) {
  try {
    const entry = Editor.above(editor, {
      match: (n) => Editor.isBlock(editor, n as any),
    });
    if (!entry) return;
    const [, path] = entry;
    // 确保块下至少有一个文本叶子
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

function toggleMark(editor: Editor, format: keyof CustomText) {
  if (!editor.selection) {
    ensureEditableRoot(editor);
    return;
  }
  // 如果选区落在非叶子节点，先移动到块首文本
  try {
    const [match] = Array.from(
      Editor.nodes(editor, { match: (n) => Editor.isBlock(editor, n as any) }),
    );
    if (match) {
      const [, path] = match;
      const point = Editor.start(editor, path);
      Transforms.select(editor, point);
    }
  } catch {
    // ignore
  }
  const active = isMarkActive(editor, format);
  if (active) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function ensureEditableRoot(editor: Editor) {
  if (!editor.children || editor.children.length === 0) {
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    } as any);
  }
  try {
    // Will throw if tree is still invalid
    Editor.start(editor, []);
  } catch {
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    } as any);
  }
}

function isBlockActive(editor: Editor, format: CustomElement["type"]) {
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

function toggleBlock(editor: Editor, format: CustomElement["type"]) {
  if (!editor.selection) {
    ensureEditableRoot(editor);
    try {
      Transforms.select(editor, Editor.start(editor, []));
    } catch {
      return;
    }
  }
  ensureEditableRoot(editor);
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as any).type as string),
    split: true,
  });

  const newType: CustomElement["type"] = isActive
    ? "paragraph"
    : isList
      ? "list-item"
      : format;

  Transforms.setNodes<SlateElement>(editor, { type: newType } as any);

  if (!isActive && isList) {
    const block: SlateElement = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
  moveCursorToBlockStart(editor);
}

function handleMarkdownShortcut(editor: Editor, event: React.KeyboardEvent) {
  if (event.key !== " " || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;
  ensureEditableRoot(editor);

  const blockEntry = Editor.above(editor, {
    match: (n) => Editor.isBlock(editor, n as any),
  });
  if (!blockEntry) return false;

  const [, path] = blockEntry;
  const text = Editor.string(editor, path);
  // 取到当前光标前的内容（空格尚未插入）
  const before = text.slice(0, selection.anchor.offset);
  const trimmed = before.trim();

  const convert = (type: CustomElement["type"]) => {
    event.preventDefault();
    // 删除前缀标记
    Transforms.delete(editor, {
      at: { anchor: Editor.start(editor, path), focus: selection.anchor },
    });
    if (LIST_TYPES.includes(type)) {
      toggleBlock(editor, type);
    } else {
      Transforms.setNodes(editor, { type } as any, { at: path });
    }
    // 确保光标落在当前块开头，继续输入有样式
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

export default function PlateEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "开始输入…",
}: PlateEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const safeValue =
    Array.isArray(value) && value.length > 0 ? value : DEFAULT_VALUE;

  useEffect(() => {
    ensureEditableRoot(editor);
  }, [editor, safeValue]);

  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case "paragraph":
        return <p {...attributes}>{children}</p>;
      case "heading-one":
        return (
          <h1 className="text-2xl font-bold" {...attributes}>
            {children}
          </h1>
        );
      case "heading-two":
        return (
          <h2 className="text-xl font-semibold" {...attributes}>
            {children}
          </h2>
        );
      case "bulleted-list":
        return (
          <ul
            className="list-disc space-y-1 pl-6 leading-relaxed"
            {...attributes}
          >
            {children}
          </ul>
        );
      case "numbered-list":
        return (
          <ol
            className="list-decimal space-y-1 pl-6 leading-relaxed"
            {...attributes}
          >
            {children}
          </ol>
        );
      case "list-item":
        return (
          <li className="ml-0 pl-0" {...attributes}>
            {children}
          </li>
        );
      case "block-quote":
        return (
          <blockquote
            className="border-muted text-muted-foreground border-l-4 pl-3 italic"
            {...attributes}
          >
            {children}
          </blockquote>
        );
      case "code-block":
        return (
          <pre
            className="bg-muted rounded px-3 py-2 font-mono text-sm"
            {...attributes}
          >
            <code>{children}</code>
          </pre>
        );
      default:
        return <div {...attributes}>{children}</div>;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    let el = children;
    if (leaf.bold) el = <strong>{el}</strong>;
    if (leaf.italic) el = <em>{el}</em>;
    if (leaf.underline) el = <u>{el}</u>;
    if (leaf.code)
      el = (
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-[90%]">
          {el}
        </code>
      );
    return <span {...attributes}>{el}</span>;
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // markdown 风格的行首快捷输入（# + 空格 等）
      if (handleMarkdownShortcut(editor, event)) return;

      // 回车退出标题：在 heading 块中敲回车，创建新的段落并移动光标
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
          // 在 heading 之后插入一个新段落
          Transforms.insertNodes(
            editor,
            { type: "paragraph", children: [{ text: "" }] } as any,
            { at: insertPath },
          );
          // 光标移动到新段落开头
          Transforms.select(editor, Editor.start(editor, insertPath));
          return;
        }
      }

      // 退格清空列表行后，恢复为普通段落
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
                // 多项列表：删除当前项，光标移到上一项末尾
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
                // 单项列表：将该项转为段落并解包列表
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
              // 唯一列表项且光标在行首，允许退格退出列表
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
            // 光标恰好在列表容器上，且容器为空时，整体转为段落
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

  const ToolbarButton = ({
    onClick,
    active,
    label,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded px-2 py-1 text-xs ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="bg-card/70 flex flex-wrap gap-2 rounded-md border p-2">
          <ToolbarButton
            label="B"
            active={isMarkActive(editor, "bold")}
            onClick={() => toggleMark(editor, "bold")}
          />
          <ToolbarButton
            label="I"
            active={isMarkActive(editor, "italic")}
            onClick={() => toggleMark(editor, "italic")}
          />
          <ToolbarButton
            label="U"
            active={isMarkActive(editor, "underline")}
            onClick={() => toggleMark(editor, "underline")}
          />
          <ToolbarButton
            label="Code"
            active={isMarkActive(editor, "code")}
            onClick={() => toggleMark(editor, "code")}
          />
          <ToolbarButton
            label="H1"
            active={isBlockActive(editor, "heading-one")}
            onClick={() => toggleBlock(editor, "heading-one")}
          />
          <ToolbarButton
            label="H2"
            active={isBlockActive(editor, "heading-two")}
            onClick={() => toggleBlock(editor, "heading-two")}
          />
          <ToolbarButton
            label="• List"
            active={isBlockActive(editor, "bulleted-list")}
            onClick={() => toggleBlock(editor, "bulleted-list")}
          />
          <ToolbarButton
            label="1. List"
            active={isBlockActive(editor, "numbered-list")}
            onClick={() => toggleBlock(editor, "numbered-list")}
          />
          <ToolbarButton
            label="Quote"
            active={isBlockActive(editor, "block-quote")}
            onClick={() => toggleBlock(editor, "block-quote")}
          />
          <ToolbarButton
            label="Code Block"
            active={isBlockActive(editor, "code-block")}
            onClick={() => toggleBlock(editor, "code-block")}
          />
        </div>
      )}

      <Slate
        key={JSON.stringify(safeValue)}
        editor={editor as any}
        initialValue={safeValue}
        onChange={onChange}
      >
        <Editable
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="prose prose-sm bg-card/80 min-h-[200px] max-w-none rounded-md border p-3 focus:outline-none"
        />
      </Slate>
    </div>
  );
}
