"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function CreateNoteButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);
  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/")}`,
    [currentPath],
  );
  const mutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      router.push(`/notes/${note.id}`);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        router.push(authUrl);
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
          tags: [],
        })
      }
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "创建中..." : "立即创建笔记"}
    </Button>
  );
}
