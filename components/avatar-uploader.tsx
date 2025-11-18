"use client";

import type { PutBlobResult } from "@vercel/blob";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function AvatarUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = inputRef.current?.files;

    if (!files?.length) {
      setError("请选择一个头像文件");
      return;
    }

    const file = files[0];
    setIsUploading(true);
    setError(null);

    const response = await fetch(
      `/api/avatar/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        body: file,
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error ?? "上传失败，请稍后重试。");
      setBlob(null);
    } else {
      const result = (await response.json()) as PutBlobResult;
      setBlob(result);
    }

    setIsUploading(false);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border p-6 text-left">
      <div>
        <h2 className="text-xl font-semibold">上传头像</h2>
        <p className="text-sm text-muted-foreground">
          文件会先到 Next.js 服务器，再上传到 Vercel Blob。
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
        <Button type="submit" size="lg" disabled={isUploading}>
          {isUploading ? "上传中..." : "上传头像"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {blob && (
        <div className="space-y-1 rounded-md bg-muted/40 p-4 text-sm">
          <p className="font-medium">上传成功</p>
          <a
            href={blob.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {blob.url}
          </a>
        </div>
      )}
    </div>
  );
}
