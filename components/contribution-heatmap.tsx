"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GitHubCalendar = dynamic(
  () => import("react-github-calendar").then((mod) => mod.GitHubCalendar),
  { ssr: false },
);

type ContributionHeatmapProps = {
  className?: string;
};

export function ContributionHeatmap({ className }: ContributionHeatmapProps) {
  return (
    <Card className={cn("flex-1", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">活跃度</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-0">
        <GitHubCalendar
          username="octocat"
          transformData={() => []}
          loading
          blockSize={12}
          blockMargin={3}
          colorScheme="light"
        />
      </CardContent>
    </Card>
  );
}
