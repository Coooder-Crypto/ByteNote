"use client";

import { useMemo } from "react";
import type { Descendant } from "slate";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { trpc } from "@/lib/trpc/client";
import type { AiMeta } from "@/types/editor";

type AiResultPayload = {
  contentJson?: Descendant[] | null;
  summary?: string | null;
  aiMeta?: AiMeta;
  version?: number | null;
};

type AiSummaryPanelProps = {
  noteId: string;
  summary?: string | null;
  readOnly?: boolean;
  disabled?: boolean;
  canUseAi?: boolean;
  onResult?: (payload?: AiResultPayload | null) => void;
};

export default function AiSummaryPanel({
  noteId,
  summary,
  readOnly = false,
  disabled = false,
  canUseAi = true,
  onResult,
}: AiSummaryPanelProps) {
  const utils = trpc.useUtils();
  const aiSummarize = trpc.note.aiSummarize.useMutation({
    onSuccess: (data) => {
      onResult?.({
        contentJson: Array.isArray(data?.contentJson)
          ? (data.contentJson as Descendant[])
          : null,
        summary: typeof data?.summary === "string" ? data.summary : null,
        aiMeta:
          data?.aiMeta && typeof data.aiMeta === "object"
            ? (data.aiMeta as AiMeta)
            : undefined,
        version: typeof data?.version === "number" ? data.version : null,
      });
      void utils.note.detail.invalidate({ id: noteId });
      void utils.note.list.invalidate();
      toast.success("已生成摘要");
    },
    onError: (err) => {
      toast.error(err?.message ?? "生成摘要失败");
    },
  });

  const buttonText = useMemo(() => {
    if (aiSummarize.isPending) return "生成中...";
    return summary ? "重新生成" : "生成摘要";
  }, [aiSummarize.isPending, summary]);

  const handleClick = () => {
    if (readOnly || disabled) return;
    if (!canUseAi) {
      toast.error("当前不可用，检查网络或权限");
      return;
    }
    aiSummarize.mutate({ id: noteId });
  };

  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            AI 摘要
          </span>
          {aiSummarize.isPending && (
            <span className="text-primary text-[11px]">生成中...</span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-2 py-1 text-xs"
          onClick={handleClick}
          disabled={readOnly || disabled || aiSummarize.isPending}
        >
          {buttonText}
        </Button>
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
  );
}
