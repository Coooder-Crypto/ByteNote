"use client";

import {
  ArrowUpDown,
  Calendar,
  Clock,
  FolderOpen,
  Menu,
  Plus,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

import TagPills from "./NotesTags";

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
  onClearTags?: () => void;
  activeFilter?: "all" | "favorite" | "trash" | "collab";
  onToggleMobileMenu?: () => void;
  onRefresh?: () => void;
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
  onClearTags,
  activeFilter = "all",
  onToggleMobileMenu,
  onRefresh,
}: NotesHeaderProps) {
  const sortedTags = useMemo(() => [...tags].sort(), [tags]);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const filterMeta = useMemo(() => {
    switch (activeFilter) {
      case "favorite":
        return {
          title: "Favorites",
          description: "Starred ideas you want to keep close.",
          icon: Star,
          tone: "text-amber-500",
          badge: "Favorites",
        };
      case "trash":
        return {
          title: "Trash",
          description: "Recently removed notes live here.",
          icon: Trash2,
          tone: "text-rose-500",
          badge: "Trash",
        };
      case "collab":
        return {
          title: "Collab Notes",
          description: "Co-edit with your team in real time.",
          icon: Users,
          tone: "text-sky-500",
          badge: "Collab",
        };
      default:
        return {
          title: "All Notes",
          description: "Every idea and draft in one place.",
          icon: FolderOpen,
          tone: "text-primary",
          badge: "All Notes",
        };
    }
  }, [activeFilter]);

  const Icon = filterMeta.icon;
  const createDisabled = activeFilter === "trash";

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button
            onClick={onToggleMobileMenu}
            variant="ghost"
            size="icon-sm"
            className="hidden"
            aria-label="打开/关闭侧边栏"
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2 truncate">
            <Icon className={cn("shrink-0", filterMeta.tone)} size={28} />
            <span className="text-foreground truncate text-2xl font-bold capitalize">
              {filterMeta.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="icon-sm"
              title="刷新"
              aria-label="刷新列表"
            >
              <RefreshCcw className="size-4" />
            </Button>
          )}
          {!createDisabled && (
            <Button
              onClick={onCreate}
              variant="outline"
              size="sm"
              className="shrink-0"
              title="新建笔记"
              aria-label="新建笔记"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="group relative flex-1 min-w-[220px]">
          <Search
            className="group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 transition-colors"
            size={20}
          />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search titles and content..."
            className="bg-muted/70 focus:ring-primary text-foreground placeholder:text-muted-foreground h-[44px] w-full rounded-xl border-none py-2.5 pr-4 pl-10 text-base shadow-inner transition-all focus:ring-2 focus:outline-none"
            aria-label="搜索笔记"
          />
        </div>

        <div className="relative">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              setIsSortMenuOpen((prev) => !prev);
            }}
            variant="outline"
            size="sm"
            className="h-[44px] whitespace-nowrap px-3"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              Sort by:{" "}
              <span className="text-foreground capitalize">
                {sortKey === "updatedAt" ? "updated" : "created"}
              </span>
            </span>
          </Button>

          {isSortMenuOpen && (
            <div className="bg-card border-border/60 animate-in fade-in zoom-in-95 absolute top-full right-0 z-20 mt-2 w-48 rounded-xl border p-1.5 shadow-xl duration-100">
              <SortOption
                icon={Clock}
                active={sortKey === "updatedAt"}
                label="Last Updated"
                onClick={() => {
                  onSortChange("updatedAt");
                  setIsSortMenuOpen(false);
                }}
              />
              <SortOption
                icon={Calendar}
                active={sortKey === "createdAt"}
                label="Date Created"
                onClick={() => {
                  onSortChange("createdAt");
                  setIsSortMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {sortedTags.length > 0 && (
        <TagPills
          tags={sortedTags}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
        />
      )}
    </div>
  );
}

type SortOptionProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: typeof Clock;
};

function SortOption({ active, label, onClick, icon: Icon }: SortOptionProps) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="w-full justify-start gap-2 text-left"
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
    </Button>
  );
}
