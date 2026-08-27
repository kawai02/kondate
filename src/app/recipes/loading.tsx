export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-24 rounded-lg bg-[var(--card-2)]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-20 rounded-2xl border-[3px] border-[var(--card-2)]" />
          <div className="h-20 rounded-2xl border-[3px] border-[var(--card-2)]" />
          <div className="h-20 rounded-2xl border-[3px] border-[var(--card-2)]" />
          <div className="h-20 rounded-2xl border-[3px] border-[var(--card-2)]" />
        </div>
      </div>
    </main>
  );
}
