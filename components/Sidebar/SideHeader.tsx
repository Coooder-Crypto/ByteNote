import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

type SideHeaderProps = {
  onCreate: () => void;
};

export function SideHeader({ onCreate }: SideHeaderProps) {
  return (
    <div className="border-border/60 border-b px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="from-primary-500 to-byte-teal shadow-primary-500/20 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 13H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 17H12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
            Byte Note
          </p>
          <p className="text-foreground text-lg font-semibold">字节训练营</p>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onCreate}>
        <Plus className="size-4" />
        新建笔记
      </Button>
    </div>
  );
}
