import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type SideHeaderProps = {
  onCreate: () => void;
};

export function SideHeader({ onCreate }: SideHeaderProps) {
  return (
    <div className="border-border/60 border-b px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <p className="text-foreground text-lg font-semibold">Byte Note</p>
      </div>
      <Button className="w-full rounded-xl" onClick={onCreate}>
        <Plus className="size-4" />
        新建笔记
      </Button>
    </div>
  );
}
