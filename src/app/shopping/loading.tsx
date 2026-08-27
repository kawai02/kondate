export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-11 rounded-lg bg-black/5 dark:bg-white/5" />
        <div className="h-6 w-20 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-10 rounded bg-black/5 dark:bg-white/5" />
        <div className="h-10 rounded bg-black/5 dark:bg-white/5" />
        <div className="h-10 rounded bg-black/5 dark:bg-white/5" />
      </div>
    </main>
  );
}
