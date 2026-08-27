import Link from "next/link";
import { listCookingLogs } from "@/lib/cooking-logs";
import { deleteCookingLogAction } from "@/lib/cooking-log-actions";
import styles from "@/app/_components/kondate-theme.module.css";

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

export async function CookingHistory({ recipeId }: { recipeId: string }) {
  // logsはcooked_on降順なので、件数と最終調理日はここから導出できる
  // （従来はgetCookingStatsで別途1往復していた）。
  const logs = await listCookingLogs(recipeId);
  const stats = { count: logs.length, lastCookedOn: logs[0]?.cooked_on ?? null };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`${styles.heading} text-lg text-[var(--outline)]`}>調理履歴</h2>
        <Link
          href={`/cook-log/new?recipe_id=${recipeId}`}
          className={`${styles.chunky} ${styles.cGreen} h-9 px-3 text-sm`}
        >
          作った
        </Link>
      </div>

      <p className="mb-4 text-sm font-bold text-[var(--ink-soft)]">
        調理回数 {stats.count}回
        {stats.lastCookedOn && <> ／ 最終調理日 {formatDate(stats.lastCookedOn)}</>}
      </p>

      {logs.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">まだ記録が無い</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className={`${styles.card} p-3`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--ink)]">{formatDate(log.cooked_on)}</span>
                <div className="flex items-center gap-2">
                  {log.rating != null && (
                    <span className="font-bold">
                      {log.rating === "good" ? "😋 おいしかった" : "🙁 イマイチ"}
                    </span>
                  )}
                  <form action={deleteCookingLogAction.bind(null, log.id, recipeId)}>
                    <button type="submit" className={`${styles.dangerLink} text-xs`} aria-label="削除">
                      削除
                    </button>
                  </form>
                </div>
              </div>
              {log.comment && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink)]">{log.comment}</p>
              )}
              {log.author && (
                <p className="mt-1 text-xs font-bold text-[var(--ink-soft)]">記入: {log.author}</p>
              )}
              {log.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={log.photo_url}
                  alt=""
                  className="mt-2 h-32 w-full rounded-xl border-2 border-[var(--outline)] object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
