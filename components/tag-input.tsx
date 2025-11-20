"use client";

import { type KeyboardEvent, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTagLabel, NOTE_TAGS } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setInputValue("");
      return;
    }
    onChange([...value, tag]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", "Tab", ","].includes(event.key)) {
      event.preventDefault();
      addTag(inputValue);
    } else if (event.key === "Backspace" && !inputValue && value.length > 0) {
      event.preventDefault();
      removeTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => addTag(inputValue);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card px-3 py-2 shadow-sm min-h-[44px]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs"
          >
            {getTagLabel(tag)}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(tag)}
              aria-label={`移除 ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[100px] sm:min-w-[180px] border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground transition-[width]"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : undefined}
        />
        <Select
          key={value.join("|")}
          onValueChange={(selection) => addTag(selection)}
        >
          <SelectTrigger className="h-10 w-[150px] rounded-lg border border-border/60 bg-background/80 text-xs">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TAGS.map((tag) => (
              <SelectItem key={tag.value} value={tag.value}>
                {tag.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
