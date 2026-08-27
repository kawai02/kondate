"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { copyMenuEntriesAction } from "@/lib/menu-copy-actions";
import styles from "@/app/_components/kondate-theme.module.css";

function today(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function CopyForm() {
  const [sourceStart, setSourceStart] = useState(today());
  const [sourceEnd, setSourceEnd] = useState(today());
  const [targetStart, setTargetStart] = useState(today());
  const [mode, setMode] = useState<"weekday" | "date">("weekday");
  const [conflict, setConflict] = useState<"overwrite" | "skip" | "append">("skip");
  const [result, setResult] = useState<{ copied: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await copyMenuEntriesAction({
          sourceStart,
          sourceEnd,
          targetStart,
          mode,
          conflict,
        });
        setResult(r);
      } catch {
        setError("コピーに失敗した");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-bold">コピー元期間</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={sourceStart}
            onChange={(e) => setSourceStart(e.target.value)}
            className={`${styles.searchInput} h-11 px-3 text-base`}
          />
          <span className="text-sm text-[var(--ink-soft)]">〜</span>
          <input
            type="date"
            value={sourceEnd}
            onChange={(e) => setSourceEnd(e.target.value)}
            className={`${styles.searchInput} h-11 px-3 text-base`}
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="target-start">
          コピー先の開始日
        </label>
        <input
          id="target-start"
          type="date"
          value={targetStart}
          onChange={(e) => setTargetStart(e.target.value)}
          className={`${styles.searchInput} h-11 px-3 text-base`}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">写し方</h2>
        <div className="space-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "weekday"}
              onChange={() => setMode("weekday")}
              className="accent-[var(--orange)]"
            />
            曜日基準（同じ曜日に写す。土日に手の込んだ料理を置く運用向け）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "date"}
              onChange={() => setMode("date")}
              className="accent-[var(--orange)]"
            />
            日付基準（日数差をそのまま平行移動）
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">コピー先に既に献立がある日の扱い</h2>
        <div className="space-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "skip"}
              onChange={() => setConflict("skip")}
              className="accent-[var(--orange)]"
            />
            スキップ（既存を残す）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "overwrite"}
              onChange={() => setConflict("overwrite")}
              className="accent-[var(--orange)]"
            />
            上書き（既存を削除して置き換える）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "append"}
              onChange={() => setConflict("append")}
              className="accent-[var(--orange)]"
            />
            追加（既存の後ろに足す）
          </label>
        </div>
      </section>

      {error && <p className={`${styles.dangerLink} text-sm`}>{error}</p>}

      {result && (
        <div className={`${styles.resultCard} p-3 text-sm`}>
          <p>
            {result.copied}件コピー、{result.skipped}件スキップした。
          </p>
          <Link href="/" className="mt-2 inline-block font-bold underline">
            献立カレンダーで確認する
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base disabled:opacity-50`}
      >
        {pending ? "コピー中…" : "コピーする"}
      </button>
    </div>
  );
}
