import { Suspense } from "react";

import { Sidebar } from "@/components/sidebar";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex h-svh w-full overflow-hidden">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 overflow-y-auto min-h-screen">{children}</div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="hidden h-svh w-[260px] flex-shrink-0 border-r border-border/60 bg-card/50 p-4 lg:block">
      <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-muted/50" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-8 w-full animate-pulse rounded bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}
