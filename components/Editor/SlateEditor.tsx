"use client";

import { StretchHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { type SharedType, withYjs } from "slate-yjs";

import { NoteTags, TagInput } from "@/components/common";
import { useShortcuts } from "@/hooks";
import {
  BLOCK_CONFIGS,
  DEFAULT_VALUE,
  MARK_KEYS,
} from "@/lib/constants/editor";

import { normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";
import { SlateToolbar, ToolbarActions } from "./slate/Toolbar";

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
    (ed as Editor & { __collab?: boolean }).__collab = true;
    return withHistory(ed);
  }, [sharedType]);

  const editor = (sharedType ? collabEditor : localEditor)!;

  const normalizedProp = useMemo(() => normalizeDescendants(value), [value]);

  const displayValue = useMemo(
    () => (normalizedProp.length > 0 ? normalizedProp : DEFAULT_VALUE),
    [normalizedProp],
  );
  const safeInitialValue =
    displayValue.length > 0 ? displayValue : DEFAULT_VALUE;
  const collabInitialValue = DEFAULT_VALUE;
  const collabReady = Boolean(sharedType && sharedType.length > 0);

  const {
    handleKeyDown,
    isMarkActive,
    isBlockActive,
    toggleMark,
    toggleBlock,
  } = useShortcuts(editor);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("bn-editor-width");
    setTimeout(() => setWide(saved === "wide"), 0);
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

  const toolbarActions: ToolbarActions = useMemo(() => {
    const marks = MARK_KEYS.reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          active: isMarkActive(key),
          onClick: () => toggleMark(key),
        },
      }),
      {} as Record<
        (typeof MARK_KEYS)[number],
        { active: boolean; onClick: () => void }
      >,
    );

    const blocks = BLOCK_CONFIGS.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: {
          active: isBlockActive(item.type),
          onClick: () => toggleBlock(item.type),
        },
      }),
      {} as Record<
        (typeof BLOCK_CONFIGS)[number]["key"],
        { active: boolean; onClick: () => void }
      >,
    );

    return { ...marks, ...blocks };
  }, [isBlockActive, isMarkActive, toggleBlock, toggleMark]);

  return (
    <div className="mt-3 flex h-[calc(100vh-96px)] flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <SlateToolbar visible={!readOnly} actions={toolbarActions} />

        <button
          type="button"
          className="bg-card/80 border-border/60 text-foreground hover:border-primary inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          onClick={toggleWidth}
          aria-label="切换编辑区域宽度"
        >
          <StretchHorizontal className="size-4" />
          {wide ? "居中" : "全宽"}
        </button>
      </div>

      <div className={`${contentWidthClass} flex-1 overflow-hidden`}>
        <div className="border-border/60 bg-card/40 flex h-full flex-col space-y-4 overflow-hidden rounded-2xl border p-4">
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

          <div className="border-border/60 bg-card/60 flex flex-1 overflow-hidden rounded-2xl border p-3">
            <div className="w-full flex-1 overflow-y-auto rounded-xl">
              {sharedType ? (
                collabReady ? (
                  <Slate
                    key={`collab-${valueKey}`}
                    editor={editor}
                    initialValue={collabInitialValue}
                    onChange={() => {}}
                  >
                    <Editable
                      readOnly={readOnly}
                      renderElement={renderElement}
                      renderLeaf={renderLeaf}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      className="prose prose-sm text-foreground min-h-[80vh] max-w-none bg-transparent p-2 leading-relaxed focus:outline-none"
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
                  editor={editor}
                  initialValue={safeInitialValue}
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
                    className="prose prose-sm text-foreground min-h-[80vh] max-w-none bg-transparent p-2 leading-relaxed focus:outline-none"
                  />
                </Slate>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
