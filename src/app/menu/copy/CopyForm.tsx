"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { copyMenuEntriesAction } from "@/lib/menu-copy-actions";

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
        <h2 className="text-sm font-medium">コピー元期間</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={sourceStart}
            onChange={(e) => setSourceStart(e.target.value)}
            className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
          />
          <span className="text-sm text-black/50 dark:text-white/50">〜</span>
          <input
            type="date"
            value={sourceEnd}
            onChange={(e) => setSourceEnd(e.target.value)}
            className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="target-start">
          コピー先の開始日
        </label>
        <input
          id="target-start"
          type="date"
          value={targetStart}
          onChange={(e) => setTargetStart(e.target.value)}
          className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">写し方</h2>
        <div className="space-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "weekday"}
              onChange={() => setMode("weekday")}
            />
            曜日基準（同じ曜日に写す。土日に手の込んだ料理を置く運用向け）
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "date"} onChange={() => setMode("date")} />
            日付基準（日数差をそのまま平行移動）
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">コピー先に既に献立がある日の扱い</h2>
        <div className="space-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "skip"}
              onChange={() => setConflict("skip")}
            />
            スキップ（既存を残す）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "overwrite"}
              onChange={() => setConflict("overwrite")}
            />
            上書き（既存を削除して置き換える）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={conflict === "append"}
              onChange={() => setConflict("append")}
            />
            追加（既存の後ろに足す）
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
          <p>
            {result.copied}件コピー、{result.skipped}件スキップした。
          </p>
          <Link href="/" className="mt-2 inline-block underline">
            献立カレンダーで確認する
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "コピー中…" : "コピーする"}
      </button>
    </div>
  );
}
