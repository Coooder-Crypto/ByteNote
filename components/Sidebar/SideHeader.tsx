type SideHeaderProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
};

function ByteNoteLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 3C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V9L14 3H6Z"
        className="fill-primary/10 stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3V9H20"
        className="fill-primary/20 stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="9.5"
        cy="13.5"
        r="1.5"
        className="fill-slate-800 dark:fill-slate-100"
      />
      <circle
        cx="14.5"
        cy="13.5"
        r="1.5"
        className="fill-slate-800 dark:fill-slate-100"
      />
      <path
        d="M10.5 16.5C10.5 16.5 11.5 17.5 13.5 16.5"
        className="stroke-slate-800 dark:stroke-slate-100"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="14.5" r="1.5" className="fill-pink-400/40" />
      <circle cx="16" cy="14.5" r="1.5" className="fill-pink-400/40" />
      <path
        d="M19 8L22 6L21 11L23 12"
        className="stroke-yellow-500 dark:stroke-yellow-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SideHeader({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
}: SideHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between px-4">
      <button
        type="button"
        onClick={() => {
          onToggleCollapse();
          onCloseMobile?.();
        }}
        className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:opacity-90"
        aria-label="切换侧栏"
      >
        <ByteNoteLogo className="h-8 w-8 shrink-0" />
        <span
          className={`text-lg font-bold whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"}`}
        >
          ByteNote
        </span>
      </button>
    </div>
  );
}
