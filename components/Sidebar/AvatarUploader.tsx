"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";
import { useAvatarUpload } from "@/hooks";
import { cn } from "@/lib/utils";

type AvatarUploaderProps = {
  value?: string | null;
  onUploaded?: (url: string) => void;
  className?: string;
};

export default function AvatarUploader({
  value,
  onUploaded,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error, preview, setPreview } = useAvatarUpload();

  useEffect(() => {
    setPreview(value ?? null);
  }, [setPreview, value]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
    await upload(file, (url) => onUploaded?.(url));
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
      <Button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        variant="outline"
        size="icon-lg"
        className="border-border/60 bg-muted/50 relative h-28 w-28 overflow-hidden rounded-full border p-0"
      >
        {preview ? (
          <Image
            src={preview}
            alt="avatar"
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
            无头像
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
          {isUploading ? "上传中..." : "点击更换"}
        </div>
      </Button>
      <p className="text-muted-foreground text-xs">
        支持 JPG / PNG / WEBP，点击头像上传
      </p>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
