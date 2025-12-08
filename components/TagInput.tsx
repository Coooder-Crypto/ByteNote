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
        "bg-card/40 flex flex-row items-center gap-2 rounded-xl px-2 py-2",
        className,
      )}
    >
      <div className="text-foreground w-min-[120px] flex-1 border-none bg-transparent text-sm outline-none">
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-muted/70 text-foreground/80 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm"
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
      </div>

      <input
        className="text-foreground placeholder:text-muted-foreground w-[120px] border-none bg-transparent text-sm outline-none"
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
        <SelectTrigger className="text-muted-foreground hover:bg-muted/60 h-9 min-w-[130px] rounded-lg border-none bg-transparent px-2 text-xs shadow-none">
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
  );
}
