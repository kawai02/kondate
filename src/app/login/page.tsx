"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-xl font-semibold">献立管理</h1>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "ログイン中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}
