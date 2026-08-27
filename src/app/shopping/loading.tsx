export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 rounded-lg bg-[var(--card-2)]" />
        <div className="h-11 rounded-2xl border-[3px] border-[var(--card-2)]" />
        <div className="h-6 w-20 rounded-lg bg-[var(--card-2)]" />
        <div className="h-10 rounded-xl border-[3px] border-[var(--card-2)]" />
        <div className="h-10 rounded-xl border-[3px] border-[var(--card-2)]" />
        <div className="h-10 rounded-xl border-[3px] border-[var(--card-2)]" />
      </div>
    </main>
  );
}
