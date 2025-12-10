"use client";

import { StretchHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { type SharedType, withYjs } from "slate-yjs";

import { useShortcuts } from "@/hooks";
import {
  BLOCK_CONFIGS,
  DEFAULT_VALUE,
  MARK_KEYS,
} from "@/lib/constants/editor";
import type { AiMeta } from "@/types/editor";

import { normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";
import type { ToolbarActions } from "./slate/Toolbar";

const SlateToolbar = dynamic(
  () => import("./slate/Toolbar").then((m) => m.SlateToolbar),
  { ssr: false, loading: () => null },
);

const TagInput = dynamic(() => import("@/components/common/TagInput"), {
  ssr: false,
  loading: () => null,
});

const NoteTags = dynamic(() => import("@/components/common/NoteTags"), {
  loading: () => null,
});

const AiSummaryPanel = dynamic(() => import("./ai/SummaryPanel"), {
  ssr: false,
  loading: () => (
    <div className="border-border/60 bg-card/40 rounded-xl border p-3 text-xs text-muted-foreground">
      AI 摘要加载中...
    </div>
  ),
});

type AiResultPayload = {
  contentJson?: Descendant[] | null;
  summary?: string | null;
  aiMeta?: AiMeta;
  version?: number | null;
};

type SlateEditorProps = {
  noteId: string;
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
  canUseAi?: boolean;
  aiDisabled?: boolean;
  onAiResult?: (payload?: AiResultPayload | null) => void;
};

export default function SlateEditor({
  noteId,
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
  canUseAi = true,
  aiDisabled = false,
  onAiResult,
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
          <AiSummaryPanel
            noteId={noteId}
            summary={summary}
            readOnly={readOnly}
            disabled={aiDisabled}
            canUseAi={canUseAi}
            onResult={onAiResult}
          />

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
