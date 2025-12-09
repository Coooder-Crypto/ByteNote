"use client";

import {
  ArrowUpDown,
  Calendar,
  Clock,
  FolderOpen,
  Menu,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Input } from "@/components/ui";
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
  onClearTags?: () => void;
  activeFilter?: "all" | "favorite" | "trash" | "collab";
  onToggleMobileMenu?: () => void;
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
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onToggleMobileMenu}
            className={cn(
              "-ml-2 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800",
              onToggleMobileMenu
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 truncate">
            <Icon className={cn("shrink-0", filterMeta.tone)} size={28} />
            <span className="text-foreground truncate text-2xl font-bold capitalize">
              {filterMeta.title}
            </span>
          </div>
        </div>

        {!createDisabled && (
          <button
            onClick={onCreate}
            className="bg-card/80 border-border/60 text-foreground hover:border-primary flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            title="New Note"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create</span>
          </button>
        )}
      </div>

      <div className="mb-2 flex flex-col gap-3 sm:flex-row">
        <div className="group relative flex-1">
          <Search
            className="group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 transition-colors"
            size={20}
          />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search titles and content..."
            className="bg-muted/70 focus:ring-primary text-foreground placeholder:text-muted-foreground h-[44px] w-full rounded-xl border-none py-2.5 pr-4 pl-10 text-base shadow-inner transition-all focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsSortMenuOpen((prev) => !prev);
            }}
            className="bg-card/80 border-border/60 text-foreground hover:border-primary flex h-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              Sort by:{" "}
              <span className="text-foreground capitalize">
                {sortKey === "updatedAt" ? "updated" : "created"}
              </span>
            </span>
          </button>

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
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-2">
          <span className="text-muted-foreground mr-1 text-xs font-bold uppercase">
            Tags:
          </span>
          {sortedTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary border-primary shadow-primary/20 text-white shadow-md"
                    : "bg-card border-border/60 text-muted-foreground hover:border-primary/60",
                )}
              >
                #{tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => onClearTags?.()}
              className="text-muted-foreground hover:text-destructive hover:decoration-destructive ml-1 shrink-0 px-2 text-xs underline decoration-slate-300"
            >
              Clear
            </button>
          )}
        </div>
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

function SortOption({
  active,
  label,
  onClick,
  icon: IconNode,
}: SortOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/80",
      )}
    >
      <IconNode size={16} /> {label}
    </button>
  );
}
