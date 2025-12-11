"use client";

import {
  Activity,
  AlertCircle,
  BarChart2,
  Clock,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/client";

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TopTags({
  tags,
}: {
  tags: { tag: string; count: number }[] | undefined;
}) {
  if (!tags || tags.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        暂无标签数据，先写几篇笔记吧。
      </p>
    );
  const max = Math.max(...tags.map((t) => t.count), 1);
  return (
    <div className="space-y-2">
      {tags.map((t) => (
        <div key={t.tag} className="space-y-1">
          <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
            <span className="text-foreground font-semibold">#{t.tag}</span>
            <span>x{t.count}</span>
          </div>
          <div className="bg-muted h-2 rounded-full">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({
  activity,
}: {
  activity: { date: string; count: number }[] | undefined;
}) {
  if (!activity || activity.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        暂无活跃数据，开始创作吧。
      </p>
    );
  const data = activity.slice(-14);
  const max = Math.max(...data.map((a) => a.count), 1);
  return (
    <div className="space-y-3">
      <div className="bg-muted/40 flex items-end gap-2 rounded-xl p-3">
        {data.map((a) => (
          <div key={a.date} className="flex-1">
            <div
              className="bg-primary/80 rounded-t-md"
              style={{
                height: `${(a.count / max) * 80 + 6}px`,
                minHeight: "6px",
              }}
              title={`${new Date(a.date).toLocaleDateString()}：${a.count}`}
            />
          </div>
        ))}
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{new Date(data[0].date).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function AIReport({
  onGenerate,
  loading,
  content,
}: {
  onGenerate: () => void;
  loading: boolean;
  content?: string;
}) {
  const renderMarkdownLite = (text: string) => {
    const blocks = text.split(/\n{2,}/).filter(Boolean);
    if (blocks.length === 0) return null;
    return blocks.map((block, idx) => {
      const html = block
        // bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // lists
        .replace(/^- (.+)$/gm, "<li>$1</li>");

      if (html.includes("<li>")) {
        const items = html.replace(/^(?!<li>).*$/gm, "").trim();
        return (
          <ul
            key={idx}
            className="list-disc pl-4 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: items }}
          />
        );
      }

      return (
        <p
          key={idx}
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader className="flex items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">AI 报告</CardTitle>
          <p className="text-muted-foreground text-sm">
            总结近期笔记亮点与建议
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerate}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCcw className="size-4" />
          {loading ? "生成中..." : "重新生成"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">AI 正在分析...</p>
        ) : content ? (
          <div className="space-y-2">{renderMarkdownLite(content)}</div>
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <AlertCircle className="size-4" />
            点击生成，获取最近的笔记报告
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card
            key={`stat-skel-${idx}`}
            className="bg-card/60 border-border/60"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-6" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="flex items-center justify-between gap-3 space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={`ai-skel-${idx}`} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`tag-skel-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <Skeleton key={`bar-skel-${idx}`} className="h-12 w-full" />
              ))}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function StatsPageClient() {
  const [reportContent, setReportContent] = useState<string | undefined>();
  const overview = trpc.stats.overview.useQuery();
  const report = trpc.stats.report.useMutation({
    onSuccess: (data) => {
      setReportContent(data.content);
    },
    onError: (err) => {
      toast.error(err?.message ?? "生成报告失败");
    },
  });

  const handleGenerate = () => {
    report.mutate({ days: 30 });
  };

  const data = overview.data;
  const loading =
    overview.isLoading || (overview.isFetching && overview.data === undefined);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      {loading ? (
        <StatsSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">统计数据</h1>
              <p className="text-muted-foreground text-sm">
                最近 30 天的笔记概览与 AI 报告
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => overview.refetch()}
            >
              刷新
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="笔记数"
              value={data?.noteCount ?? "--"}
              icon={<BarChart2 className="text-primary size-4" />}
              description="最近 30 天"
            />
            <StatCard
              title="协作笔记"
              value={data?.collaborativeCount ?? "--"}
              icon={<Users className="size-4 text-blue-500" />}
              description={`${data?.collaboratorCount ?? 0} 位协作者`}
            />
            <StatCard
              title="活跃标签"
              value={data?.topTags?.length ?? 0}
              icon={<Activity className="size-4 text-emerald-500" />}
              description="Top 标签数量"
            />
            <StatCard
              title="统计窗口"
              value={`${data?.windowDays ?? 30} 天`}
              icon={<Clock className="size-4 text-amber-500" />}
              description="固定窗口"
            />
          </div>

          <AIReport
            onGenerate={handleGenerate}
            loading={report.isPending}
            content={reportContent}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  热门标签
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopTags tags={data?.topTags} />
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  活跃记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityList activity={data?.activity} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
