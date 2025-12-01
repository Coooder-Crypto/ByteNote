"use client";

import type { PutBlobResult } from "@vercel/blob";
import { useState } from "react";

type UploadResult = {
  upload: (file: File, onSuccess?: (url: string) => void) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  preview: string | null;
  reset: () => void;
  setPreview: (url: string | null) => void;
};

export default function useAvatarUpload(): UploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const upload = async (file: File, onSuccess?: (url: string) => void) => {
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
    onSuccess?.(result.url);
    setIsUploading(false);
  };

  const reset = () => {
    setIsUploading(false);
    setError(null);
    setPreview(null);
  };

  return {
    upload,
    isUploading,
    error,
    preview,
    reset,
    setPreview,
  };
}
