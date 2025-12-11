import {
  ChevronLeft,
  ChevronRight,
  Github,
  LayoutDashboard,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";

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
      <Link
        href="/"
        className="flex items-center gap-3 hover:opacity-90"
        onClick={onCloseMobile}
      >
        <ByteNoteLogo className="h-8 w-8" />
        {!collapsed && <span className="text-lg font-bold">ByteNote</span>}
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/notes" title="进入笔记">
          <Button variant="outline" size="icon-sm" className="md:hidden">
            <LayoutDashboard className="size-4" />
          </Button>
        </Link>
        <Link href="/auth" title="GitHub 登录">
          <Button variant="outline" size="icon-sm" className="md:hidden">
            <Github className="size-4" />
          </Button>
        </Link>
        <Button
          onClick={onCloseMobile}
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
        >
          <X className="size-5" />
        </Button>
        <Button
          onClick={onToggleCollapse}
          variant="outline"
          size="icon-sm"
          title={collapsed ? "展开" : "收起"}
          className="hidden md:inline"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>
    </div>
  );
}
