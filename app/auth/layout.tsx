export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
