"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export default function ProfilePage() {
  const router = useRouter();
  const meQuery = trpc.auth.me.useQuery();
  const notesQuery = trpc.note.list.useQuery(undefined, {
    enabled: Boolean(meQuery.data),
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => meQuery.refetch(),
  });
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      meQuery.refetch();
      setEditOpen(false);
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditName(meQuery.data?.name ?? "");
  }, [meQuery.data?.name]);

  const user = meQuery.data;

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-12 lg:grid-cols-[320px,1fr]">
      <aside className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="avatar"
                width={64}
                height={64}
                className="h-14 w-14 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full border border-dashed border-border" />
            )}
            <div>
              <CardTitle>{user?.name ?? "未登录"}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {user?.email ?? "请先登录"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>欢迎使用 Byte Note，点击下方按钮修改个人资料。</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {user ? (
              <>
                <Button className="w-full" onClick={() => setEditOpen(true)}>
                  编辑资料
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "退出中..." : "退出登录"}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth">登录 / 注册</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </aside>

      <main className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">我的笔记</h2>
          <p className="text-sm text-muted-foreground">
            快速跳转到任意笔记进行编辑。
          </p>
        </div>
        <Card>
          <CardContent className="py-4">
            {!user && (
              <p className="text-sm text-muted-foreground">
                请登录后查看笔记列表。
              </p>
            )}
            {user && notesQuery.isLoading && (
              <p className="text-sm text-muted-foreground">加载中...</p>
            )}
            {user && notesQuery.error && (
              <p className="text-sm text-destructive">
                {notesQuery.error.message}
              </p>
            )}
            {user && notesQuery.data && notesQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无笔记</p>
            )}
            {user && notesQuery.data && notesQuery.data.length > 0 && (
              <ul className="space-y-2 text-sm">
                {notesQuery.data.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/notes?noteId=${note.id}`)}
                    >
                      编辑
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">头像</p>
              <AvatarUploader />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">昵称</p>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="编辑昵称"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">邮箱</p>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                updateProfileMutation.mutate({
                  name: editName || undefined,
                })
              }
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "保存中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
