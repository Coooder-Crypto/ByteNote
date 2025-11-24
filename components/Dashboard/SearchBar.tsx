"use client";

import { Search as SearchIcon } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索标题、内容或标签..."
        className="border-border bg-background/80 text-foreground focus:border-primary focus:ring-primary/10 w-full rounded-2xl border py-3 pr-4 pl-12 text-sm shadow-sm transition focus:ring-4 focus:outline-none"
      />
    </div>
  );
}
