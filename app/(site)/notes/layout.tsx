import { Suspense } from "react";

import { Sidebar } from "@/components/sidebar";
import { Skeleton } from "@/components/ui";

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
      <Skeleton className="mb-4 h-10 w-3/4" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
