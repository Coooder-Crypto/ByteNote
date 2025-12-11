import Link from "next/link";

import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
  className?: string;
  onClick?: () => void;
};

const baseActive =
  "bg-primary/10 text-primary border-primary/30 border shadow-sm";
const baseInactive =
  "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent";

export default function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  className,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center overflow-hidden rounded-lg px-2 py-2 text-sm font-medium transition-all",
        collapsed ? "justify-center" : "gap-3",
        active ? baseActive : baseInactive,
        className,
      )}
      title={label}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </div>
      {!collapsed && (
        <div className="whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-in-out max-w-[200px] translate-x-0 opacity-100">
          <span>{label}</span>
        </div>
      )}
    </Link>
  );
}
