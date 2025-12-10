import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { callDeepseekChat } from "@/lib/ai/deepseek";
import { toPlainText } from "@/components/editor/slate/normalize";

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const subDays = (date: Date, days: number) =>
  new Date(startOfDay(date).getTime() - days * DAY_MS);
import { protectedProcedure, router } from "@/server/api/trpc";

export const statsRouter = router({
  overview: protectedProcedure
    .input(
      z
        .object({
          days: z.number().int().positive().max(365).default(30),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const since = subDays(startOfDay(new Date()), days);
      const userId = ctx.session!.user.id;

      // notes owned or collaborated
      const notes = await ctx.prisma.note.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          deletedAt: null,
          updatedAt: { gte: since },
        },
        select: {
          id: true,
          title: true,
          tags: true,
          updatedAt: true,
          createdAt: true,
          isCollaborative: true,
          collaborators: { select: { userId: true } },
          contentJson: true,
        },
      });

      const noteCount = notes.length;
      const collaborativeCount = notes.filter((n) => n.isCollaborative).length;
      const collabParticipants = new Set<string>();
      notes.forEach((n) =>
        n.collaborators.forEach((c) => collabParticipants.add(c.userId)),
      );

      const tagMap = new Map<string, number>();
      notes.forEach((n) => {
        try {
          const tags = Array.isArray(n.tags)
            ? n.tags
            : JSON.parse(n.tags as unknown as string);
          if (Array.isArray(tags)) {
            tags.forEach((t) => {
              if (typeof t === "string") {
                tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
              }
            });
          }
        } catch {
          // ignore parse errors
        }
      });

      const topTags = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      // simple activity by day
      const activity = new Map<string, number>();
      notes.forEach((n) => {
        const key = startOfDay(new Date(n.updatedAt)).toISOString();
        activity.set(key, (activity.get(key) ?? 0) + 1);
      });
      const activitySeries = Array.from(activity.entries())
        .map(([date, count]) => ({ date, count }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      return {
        noteCount,
        collaborativeCount,
        collaboratorCount: collabParticipants.size,
        topTags,
        activity: activitySeries,
        windowDays: days,
      };
    }),
  report: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().max(365).default(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const days = input.days ?? 30;
      const since = subDays(startOfDay(new Date()), days);
      const userId = ctx.session!.user.id;

      const notes = await ctx.prisma.note.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          deletedAt: null,
          updatedAt: { gte: since },
        },
        select: {
          id: true,
          title: true,
          tags: true,
          updatedAt: true,
          createdAt: true,
          isCollaborative: true,
          collaborators: { select: { userId: true } },
          contentJson: true,
        },
        take: 80,
      });

      if (!notes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "暂无数据，无法生成报告",
        });
      }

      const tagMap = new Map<string, number>();
      const summaries: string[] = [];
      notes.forEach((n) => {
        try {
          const tags = Array.isArray(n.tags)
            ? n.tags
            : JSON.parse(n.tags as unknown as string);
          if (Array.isArray(tags)) {
            tags.forEach((t) => {
              if (typeof t === "string") {
                tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
              }
            });
          }
        } catch {
          // ignore
        }
        const text = toPlainText(n.contentJson);
        if (text.trim()) {
          summaries.push(`${n.title || "未命名"}：${text.slice(0, 400)}`);
        }
      });

      const topTags = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `${tag}(${count})`)
        .join("、");

      const prompt = [
        {
          role: "user" as const,
          content: `你是笔记分析助手，请用不超过 180 字写一份中文周报风格总结，包含：总体概览、活跃标签、协作情况、下一步建议。避免列举太多细节。

时间范围：最近 ${days} 天
笔记数量：${notes.length}
活跃标签：${topTags || "无"}
摘取的笔记片段：
${summaries.slice(0, 12).join("\n")}`,
        },
      ];

      const ai = await callDeepseekChat(prompt, {
        temperature: 0.4,
        maxTokens: 260,
      });

      return {
        content: ai.content,
        model: ai.model,
        usage: ai.usage,
      };
    }),
});
