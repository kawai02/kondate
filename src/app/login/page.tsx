"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import styles from "@/app/_components/kondate-theme.module.css";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form action={formAction} className={`${styles.card} w-full max-w-sm space-y-4 p-6`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cat-mascot.jpg" alt="" className={`${styles.mascotImg} mx-auto`} />
        <h1 className={`${styles.heading} text-center text-xl text-[var(--outline)]`}>献立管理</h1>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-[var(--ink)]">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`${styles.searchInput} h-12 w-full px-4 text-base`}
          />
        </div>
        {state?.error && <p className={`${styles.dangerLink} text-sm`}>{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base disabled:opacity-50`}
        >
          {pending ? "ログイン中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}
