"use client";

import { type PutBlobResult } from "@vercel/blob";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type AvatarUploaderProps = {
  value?: string | null;
  onUploaded?: (url: string) => void;
  className?: string;
};

export function AvatarUploader({
  value,
  onUploaded,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(value ?? null);
  }, [value]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
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
      setIsUploading(false);
      return;
    }

    const result = (await response.json()) as PutBlobResult;
    setPreview(result.url);
    onUploaded?.(result.url);
    setIsUploading(false);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleUpload(file);
    event.target.value = "";
  };

  return (
    <div
      className={cn("flex flex-col items-center gap-3 text-center", className)}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="border-border/60 bg-muted/50 relative h-28 w-28 overflow-hidden rounded-full border"
      >
        {preview ? (
          <Image
            src={preview}
            alt="avatar"
            fill
            sizes="112px"
            className="object-cover"
            //TODO: nextjs/image
            unoptimized
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
            无头像
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
          {isUploading ? "上传中..." : "点击更换"}
        </div>
      </button>
      <p className="text-muted-foreground text-xs">
        支持 JPG / PNG / WEBP，点击头像上传
      </p>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
