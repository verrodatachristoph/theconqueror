export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="text-sm">Lädt…</span>
      </div>
    </div>
  );
}
