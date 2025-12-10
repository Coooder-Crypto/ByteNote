export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      {children}
    </div>
  );
}
