export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-8 w-2/3 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-40 rounded-xl bg-black/5 dark:bg-white/5" />
        <div className="h-40 rounded-xl bg-black/5 dark:bg-white/5" />
      </div>
    </main>
  );
}
