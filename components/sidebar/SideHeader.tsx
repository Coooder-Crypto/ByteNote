type SideHeaderProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
};

export default function SideHeader({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
}: SideHeaderProps) {
  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }
    onToggleCollapse();
    onCloseMobile?.();
  };

  return (
    <div className="flex h-16 items-center justify-between px-4">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:opacity-90 pointer-events-none md:pointer-events-auto"
        aria-label="切换侧栏"
        aria-disabled
      >
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          className="h-8 w-8 shrink-0"
        />
        <span
          className={`text-lg font-bold whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"}`}
        >
          ByteNote
        </span>
      </button>
    </div>
  );
}
