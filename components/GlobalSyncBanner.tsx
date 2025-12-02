"use client";

import { Check, Loader2, Wifi, WifiOff } from "lucide-react";

import { Button, Card } from "@/components/ui";
import useLocalSync from "@/hooks/Common/useLocalSync";
import useNetworkStatus from "@/hooks/Common/useNetworkStatus";
import { cn } from "@/lib/utils";

export default function GlobalSyncBanner() {
  const online = useNetworkStatus();
  const { flush, stats } = useLocalSync();
  const show = !online || stats.pending > 0 || stats.syncing;

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 max-w-sm">
      <Card className="bg-card/90 ring-border pointer-events-auto shadow-lg ring-1">
        <div className="flex items-start gap-3 p-4">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 items-center justify-center rounded-full",
              online
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600",
            )}
          >
            {online ? (
              <Wifi className="size-5" />
            ) : (
              <WifiOff className="size-5" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {online ? "在线" : "离线模式"}
              </p>
              {stats.syncing && (
                <Loader2 className="text-muted-foreground size-3 animate-spin" />
              )}
              {!stats.syncing && online && stats.pending === 0 && (
                <Check className="size-3 text-emerald-500" />
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {online
                ? stats.syncing
                  ? "正在同步离线编辑内容..."
                  : stats.pending > 0
                    ? `${stats.pending} 个待同步，点击手动同步`
                    : "所有更改已同步"
                : "离线也可编辑，恢复网络后会自动同步"}
            </p>
            {stats.lastSyncedId && (
              <p className="text-muted-foreground text-[11px]">
                上次同步：{stats.lastSyncedId}
              </p>
            )}
          </div>
          <div className="self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => flush()}
              disabled={!online || stats.syncing}
            >
              {stats.syncing ? "同步中..." : "立即同步"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
