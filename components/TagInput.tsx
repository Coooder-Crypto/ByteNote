"use client";

import { type KeyboardEvent, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { getTagLabel, NOTE_TAGS } from "@/lib/constants/tags";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
};

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
  suggestions,
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
        "border-border/70 bg-card min-h-[44px] rounded-lg border px-3 py-2 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="border-border/80 bg-muted/40 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
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
          className="placeholder:text-muted-foreground min-w-[100px] flex-1 border-none bg-transparent text-sm transition-[width] outline-none sm:min-w-[180px]"
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
          <SelectTrigger className="border-border/60 bg-background/80 h-10 w-[150px] rounded-lg border text-xs">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent>
            {(suggestions ?? NOTE_TAGS.map((tag) => tag.value)).map((tag) => (
              <SelectItem key={tag} value={tag}>
                {getTagLabel(tag)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
