"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function CreateNoteButton() {
  const router = useRouter();
  const mutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      router.push(`/notes/${note.id}`);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        router.push("/auth");
      }
    },
  });

  return (
    <Button
      size="lg"
      onClick={() =>
        mutation.mutate({
          title: "全新笔记",
          markdown: "# 新笔记\n\n这里是初始内容。",
          isPublic: false,
        })
      }
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "创建中..." : "立即创建笔记"}
    </Button>
  );
}
