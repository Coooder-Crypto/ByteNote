"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function CreateNoteButton() {
  const router = useRouter();
  const meQuery = trpc.auth.me.useQuery();

  const handleClick = () => {
    if (!meQuery.data) {
      router.push("/auth");
      return;
    }
    router.push("/notes/new");
  };

  return (
    <Button size="lg" onClick={handleClick}>
      立即创建笔记
    </Button>
  );
}
