import { Suspense } from "react";

import { Sidebar } from "@/components/Sidebar";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex h-svh w-full overflow-hidden">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
