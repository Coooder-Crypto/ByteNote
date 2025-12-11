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
import type React from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "text-muted-foreground hover:bg-muted/70 h-8 min-w-8 px-2 text-[11px]",
        active && "bg-primary/10 text-primary",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

type ToolbarProps = {
  visible: boolean;
  disabled?: boolean;
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

export function SlateToolbar({ visible, actions, disabled }: ToolbarProps) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1",
        disabled && "pointer-events-none opacity-60",
      )}
      aria-disabled={disabled}
    >
      <ToolbarButton icon={Heading1} label="Heading 1" {...actions.h1} />
      <ToolbarButton icon={Heading2} label="Heading 2" {...actions.h2} />
      <div className="bg-border/70 mx-1 h-4 w-px" />
      <ToolbarButton icon={Bold} label="Bold" {...actions.bold} />
      <ToolbarButton icon={Italic} label="Italic" {...actions.italic} />
      <ToolbarButton
        icon={Underline}
        label="Underline"
        {...actions.underline}
      />
      <ToolbarButton icon={Braces} label="Code" {...actions.code} />
      <div className="bg-border/70 mx-1 h-4 w-px" />
      <ToolbarButton icon={List} label="Bulleted list" {...actions.bullet} />
      <ToolbarButton
        icon={ListOrdered}
        label="Ordered list"
        {...actions.ordered}
      />
      <ToolbarButton icon={Quote} label="Quote" {...actions.quote} />
      <ToolbarButton icon={Braces} label="Code block" {...actions.codeBlock} />
    </div>
  );
}

export type ToolbarActions = ToolbarProps["actions"];
