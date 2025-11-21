import Sidebar from "@/components/Sidebar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex min-h-svh">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
