"use client";

import { StretchHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { type SharedType, withYjs } from "slate-yjs";

import { NoteTags } from "@/components/Common";
import { TagInput } from "@/components/TagInput";

import { DEFAULT_VALUE, normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";
import { SlateToolbar } from "./slate/Toolbar";
import { useEditorShortcuts } from "./slate/useEditorShortcuts";

type SlateEditorProps = {
  valueKey: string;
  value: Descendant[];
  onChange: (val: Descendant[]) => void;
  title: string;
  onTitleChange: (title: string) => void;
  titlePlaceholder?: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  tagPlaceholder?: string;
  readOnly?: boolean;
  placeholder?: string;
  sharedType?: SharedType | null;
  summary?: string | null;
  summarizing?: boolean;
  onGenerateSummary?: () => void;
};

export default function SlateEditor({
  valueKey,
  value,
  onChange,
  title,
  onTitleChange,
  titlePlaceholder = "Untitled note",
  tags,
  onTagsChange,
  tagPlaceholder = "添加标签",
  readOnly = false,
  placeholder = "开始输入…",
  sharedType,
  summary,
  summarizing,
  onGenerateSummary,
}: SlateEditorProps) {
  const [wide, setWide] = useState(false);
  const baseEditor = useMemo(() => withReact(createEditor()), []);
  const localEditor = useMemo(() => withHistory(baseEditor), [baseEditor]);

  const collabEditor = useMemo(() => {
    if (!sharedType) return null;
    const ed = withYjs(withReact(createEditor()), sharedType);
    (ed as any).__collab = true;
    return withHistory(ed);
  }, [sharedType]);

  const editor = (sharedType ? collabEditor : localEditor) as Editor;

  const normalizedProp = useMemo(() => normalizeDescendants(value), [value]);

  const displayValue = useMemo(
    () => (normalizedProp.length > 0 ? normalizedProp : DEFAULT_VALUE),
    [normalizedProp],
  );
  const collabInitialValue = DEFAULT_VALUE;
  const collabReady = Boolean((sharedType as any)?.length > 0);

  const {
    handleKeyDown,
    isMarkActive,
    isBlockActive,
    toggleMark,
    toggleBlock,
  } = useEditorShortcuts(editor);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("bn-editor-width");
    setWide(saved === "wide");
  }, []);

  const toggleWidth = () => {
    setWide((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "bn-editor-width",
          next ? "wide" : "default",
        );
      }
      return next;
    });
  };

  const contentWidthClass = wide ? "w-full" : "mx-auto w-full max-w-4xl";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SlateToolbar
          visible={!readOnly}
          actions={{
            bold: {
              active: isMarkActive("bold"),
              onClick: () => toggleMark("bold"),
            },
            italic: {
              active: isMarkActive("italic"),
              onClick: () => toggleMark("italic"),
            },
            underline: {
              active: isMarkActive("underline"),
              onClick: () => toggleMark("underline"),
            },
            code: {
              active: isMarkActive("code"),
              onClick: () => toggleMark("code"),
            },
            h1: {
              active: isBlockActive("heading-one"),
              onClick: () => toggleBlock("heading-one"),
            },
            h2: {
              active: isBlockActive("heading-two"),
              onClick: () => toggleBlock("heading-two"),
            },
            bullet: {
              active: isBlockActive("bulleted-list"),
              onClick: () => toggleBlock("bulleted-list"),
            },
            ordered: {
              active: isBlockActive("numbered-list"),
              onClick: () => toggleBlock("numbered-list"),
            },
            quote: {
              active: isBlockActive("block-quote"),
              onClick: () => toggleBlock("block-quote"),
            },
            codeBlock: {
              active: isBlockActive("code-block"),
              onClick: () => toggleBlock("code-block"),
            },
          }}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex h-9 items-center gap-2 rounded-lg border border-transparent px-3 text-xs transition"
          onClick={toggleWidth}
          aria-label="切换编辑区域宽度"
        >
          <StretchHorizontal className="size-4" />
          {wide ? "居中" : "全宽"}
        </button>
      </div>

      <div className={contentWidthClass}>
        <div className="border-border/60 bg-card/40 space-y-4 rounded-2xl border p-4">
          <div className="space-y-2">
            {readOnly ? (
              <h2 className="text-foreground text-3xl font-bold">
                {title || "笔记"}
              </h2>
            ) : (
              <input
                className="text-foreground placeholder:text-muted-foreground/60 w-full bg-transparent text-3xl font-bold tracking-tight focus:outline-none"
                value={title}
                placeholder={titlePlaceholder}
                onChange={(e) => onTitleChange(e.target.value)}
                disabled={readOnly}
              />
            )}
            {readOnly ? (
              <NoteTags tags={tags} />
            ) : (
              <TagInput
                value={tags}
                onChange={onTagsChange}
                placeholder={tagPlaceholder}
                className="w-full"
              />
            )}
          </div>

          {/* Summary block */}
          <div className="border-border/60 bg-card/40 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  AI 摘要
                </span>
                {summarizing && (
                  <span className="text-primary text-[11px]">生成中...</span>
                )}
              </div>
              {onGenerateSummary && (
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 rounded-md px-2 py-1 text-xs font-medium transition disabled:opacity-50"
                  onClick={onGenerateSummary}
                  disabled={readOnly || summarizing}
                >
                  {summary ? "重新生成" : "生成摘要"}
                </button>
              )}
            </div>
            <div className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {summary && summary.trim().length > 0 ? (
                summary
              ) : (
                <span className="text-muted-foreground/80 italic">
                  暂无摘要，点击生成试试
                </span>
              )}
            </div>
          </div>

          <div className="border-border/60 bg-card/60 rounded-2xl border p-3">
            {sharedType ? (
              collabReady ? (
                <Slate
                  key={`collab-${valueKey}`}
                  editor={editor as any}
                  initialValue={collabInitialValue}
                  onChange={() => {}}
                >
                  <Editable
                    readOnly={readOnly}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="prose prose-sm text-foreground min-h-[260px] max-w-none rounded-lg bg-transparent p-2 leading-relaxed focus:outline-none"
                  />
                </Slate>
              ) : (
                <div className="text-muted-foreground text-sm">
                  协作连接中...
                </div>
              )
            ) : (
              <Slate
                key={`local-${valueKey}`}
                editor={editor as any}
                initialValue={displayValue}
                onChange={(val) => {
                  const normalized = normalizeDescendants(val);
                  onChange(normalized);
                }}
              >
                <Editable
                  readOnly={readOnly}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="prose prose-sm text-foreground min-h-[260px] max-w-none rounded-lg bg-transparent p-2 leading-relaxed focus:outline-none"
                />
              </Slate>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
