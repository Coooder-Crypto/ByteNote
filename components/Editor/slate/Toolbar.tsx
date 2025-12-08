import type React from "react";
import {
  Bold,
  Braces,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ icon: Icon, label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted/70",
        active && "bg-primary/10 text-primary shadow-sm",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="size-4" />
    </button>
  );
}

type ToolbarProps = {
  visible: boolean;
  actions: {
    bold: { active: boolean; onClick: () => void };
    italic: { active: boolean; onClick: () => void };
    underline: { active: boolean; onClick: () => void };
    code: { active: boolean; onClick: () => void };
    h1: { active: boolean; onClick: () => void };
    h2: { active: boolean; onClick: () => void };
    bullet: { active: boolean; onClick: () => void };
    ordered: { active: boolean; onClick: () => void };
    quote: { active: boolean; onClick: () => void };
    codeBlock: { active: boolean; onClick: () => void };
  };
};

export function SlateToolbar({ visible, actions }: ToolbarProps) {
  if (!visible) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-muted/70">
      <ToolbarButton icon={Heading1} label="Heading 1" {...actions.h1} />
      <ToolbarButton icon={Heading2} label="Heading 2" {...actions.h2} />
      <div className="mx-1 h-5 w-px bg-border/70" />
      <ToolbarButton icon={Bold} label="Bold" {...actions.bold} />
      <ToolbarButton icon={Italic} label="Italic" {...actions.italic} />
      <ToolbarButton icon={Underline} label="Underline" {...actions.underline} />
      <ToolbarButton icon={Braces} label="Code" {...actions.code} />
      <div className="mx-1 h-5 w-px bg-border/70" />
      <ToolbarButton icon={List} label="Bulleted list" {...actions.bullet} />
      <ToolbarButton icon={ListOrdered} label="Ordered list" {...actions.ordered} />
      <ToolbarButton icon={Quote} label="Quote" {...actions.quote} />
      <ToolbarButton icon={Braces} label="Code block" {...actions.codeBlock} />
    </div>
  );
}
