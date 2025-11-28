"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  total: number;
  onCreate: () => void;
};

export default function PageHeader({ total, onCreate }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
          我的笔记
        </p>
        <h1 className="text-foreground mt-1 text-3xl font-semibold">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          共 {total} 条笔记，继续保持创作吧。
        </p>
      </div>
      <Button size="lg" className="rounded-2xl" onClick={onCreate}>
        <Plus className="size-4" />
        新建笔记
      </Button>
    </div>
  );
}
