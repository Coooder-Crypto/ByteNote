"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  name: string;
  onNameChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function CreateFolderDialog({
  open,
  name,
  onNameChange,
  onClose,
  onSubmit,
  submitting,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建分组</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="输入分组名称"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || name.trim().length === 0}
          >
            {submitting ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
