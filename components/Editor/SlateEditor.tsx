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
import { BLOCK_CONFIGS, MARK_KEYS } from "@/lib/constants/editor";

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

  const toolbarActions = useMemo(() => {
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
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SlateToolbar visible={!readOnly} actions={toolbarActions as any} />

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
