type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded px-2 py-1 text-xs ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70"
      }`}
    >
      {label}
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
    <div className="bg-card/70 flex flex-wrap gap-2 rounded-md border p-2">
      <ToolbarButton label="B" {...actions.bold} />
      <ToolbarButton label="I" {...actions.italic} />
      <ToolbarButton label="U" {...actions.underline} />
      <ToolbarButton label="Code" {...actions.code} />
      <ToolbarButton label="H1" {...actions.h1} />
      <ToolbarButton label="H2" {...actions.h2} />
      <ToolbarButton label="• List" {...actions.bullet} />
      <ToolbarButton label="1. List" {...actions.ordered} />
      <ToolbarButton label="Quote" {...actions.quote} />
      <ToolbarButton label="Code Block" {...actions.codeBlock} />
    </div>
  );
}
