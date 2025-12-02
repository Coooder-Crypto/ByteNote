"use client";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">当前离线</h1>
      <p className="text-muted-foreground">
        无网络连接。已保存的笔记仍保留在本地，恢复联网后会自动同步。
      </p>
      <p className="text-muted-foreground text-sm">
        返回后端口：可在有网时访问 /notes 继续编辑。
      </p>
    </main>
  );
}
