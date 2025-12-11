"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Descendant, Editor } from "slate";
import { Editable, Slate } from "slate-react";
import { type SharedType } from "slate-yjs";

import { Skeleton } from "@/components/ui";
import { DEFAULT_VALUE } from "@/lib/constants/editor";
import type { AiMeta } from "@/types/editor";

import { normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";

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
    <div className="border-border/60 bg-card/40 text-muted-foreground rounded-xl border p-3 text-xs">
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
  onAiResult?: (payload?: AiResultPayload | null) => void;
  editor: Editor;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  wide: boolean;
  loading?: boolean;
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
  onAiResult,
  editor,
  handleKeyDown,
  wide,
  loading = false,
}: SlateEditorProps) {
  const contentWidthClass = wide ? "w-full" : "mx-auto w-full max-w-4xl";

  const isCollab = Boolean(sharedType);

  const normalizedProp = useMemo(
    () => (isCollab ? [] : normalizeDescendants(value)),
    [isCollab, value],
  );

  const displayValue = useMemo(
    () => (normalizedProp.length > 0 ? normalizedProp : DEFAULT_VALUE),
    [normalizedProp],
  );

  const safeInitialValue =
    displayValue.length > 0 ? displayValue : DEFAULT_VALUE;
  const collabInitialValue = DEFAULT_VALUE;
  const collabReady = Boolean(sharedType && sharedType.length > 0);
  const slateInitialValue = isCollab ? collabInitialValue : safeInitialValue;
  const slateKey = valueKey;
  const slateOnChange = isCollab
    ? () => {}
    : (val: Descendant[]) => {
        const normalized = normalizeDescendants(val);
        onChange(normalized);
      };
  const showSkeleton = loading || (isCollab && !collabReady);

  return (
    <div
      className={`${contentWidthClass} flex min-h-full flex-1 flex-col space-y-4 p-4 pb-6`}
    >
      <div className="flex flex-col gap-4">
        {showSkeleton ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : readOnly ? (
          <h2 className="text-foreground py-4 text-3xl font-bold">
            {title || "笔记"}
          </h2>
        ) : (
          <input
            className="text-foreground placeholder:text-muted-foreground/60 w-full bg-transparent text-3xl font-bold tracking-tight focus:outline-none"
            value={title}
            placeholder={titlePlaceholder}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={readOnly}
            aria-label="笔记标题"
          />
        )}
        {!showSkeleton &&
          (readOnly ? (
            <NoteTags tags={tags} />
          ) : (
            <TagInput
              value={tags}
              onChange={onTagsChange}
              placeholder={tagPlaceholder}
              className="border-border/60 bg-card/40 w-full rounded-xl border"
              aria-label="标签输入"
            />
          ))}
      </div>

      {showSkeleton ? (
        <div className="border-border/60 bg-card/40 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={`ai-skel-${idx}`} className="h-3 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <AiSummaryPanel
          noteId={noteId}
          summary={summary}
          readOnly={readOnly}
          disabled={!canUseAi}
          canUseAi={canUseAi}
          onResult={onAiResult}
        />
      )}

      <div className="min-h-full w-full flex-1 rounded-xl">
        {showSkeleton ? (
          <div className="text-muted-foreground space-y-3 text-sm">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={`collab-skel-${idx}`} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <Slate
            key={slateKey}
            editor={editor}
            initialValue={slateInitialValue}
            onChange={slateOnChange}
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
  );
}
