"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: number;
};

export function Avatar({
  src,
  alt = "avatar",
  fallback = "U",
  className,
  size = 36,
}: AvatarProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span>{fallback.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

export function AvatarImage(props: any) {
  return <img {...props} />;
}

export function AvatarFallback({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
    >
      {children}
    </div>
  );
}
