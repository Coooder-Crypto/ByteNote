import { Plus, SortAsc } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type NotesHeaderProps = {
  total: number;
  onCreate: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  sortKey: "updatedAt" | "createdAt";
  onSortChange: (key: "updatedAt" | "createdAt") => void;
};

export default function NotesHeader({
  total,
  onCreate,
  searchValue,
  onSearchChange,
  tags,
  selectedTags,
  onToggleTag,
  sortKey,
  onSortChange,
}: NotesHeaderProps) {
  const sortedTags = useMemo(() => [...tags].sort(), [tags]);
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索标题、内容或标签..."
            className="h-11 rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-2 md:w-[520px]">
          <div className="border-border/60 bg-card/80 flex flex-wrap gap-2 rounded-xl border px-3 py-2 text-sm">
            {sortedTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1 transition",
                    active
                      ? "bg-primary/10 text-primary border-primary/50 border"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  #{tag}
                </button>
              );
            })}
            {sortedTags.length === 0 && (
              <span className="text-muted-foreground text-xs">暂无标签</span>
            )}
          </div>
          <div className="flex items-center gap-3 self-end">
            <Select
              open={sortOpen}
              onOpenChange={setSortOpen}
              value={sortKey}
              onValueChange={(value) =>
                onSortChange(value as "updatedAt" | "createdAt")
              }
            >
              <SelectTrigger className="h-9 w-10 rounded-lg px-2 text-xs">
                <SortAsc className="size-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">按修改时间排序</SelectItem>
                <SelectItem value="createdAt">按创建时间排序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
