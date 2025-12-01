type SideHeaderProps = {
  onCreate?: () => void;
};

export default function SideHeader({ onCreate }: SideHeaderProps) {
  return (
    <div className="border-border/60 border-b px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-lg font-semibold">Byte Note</p>
        {onCreate && (
          <button
            className="rounded-lg border px-3 py-1 text-sm"
            onClick={onCreate}
            type="button"
          >
            新建
          </button>
        )}
      </div>
    </div>
  );
}
