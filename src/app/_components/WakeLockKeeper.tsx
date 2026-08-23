"use client";

import { useEffect } from "react";

// 仕様書セクション6「調理中は画面が自動で暗くならないようにする」。
// navigator.wakeLockが無いブラウザ（iOS Safariの旧バージョン等）では
// 存在チェックのみ行い、フォールバックは実装しない（仕様書の明示どおり）。
export function WakeLockKeeper() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    navigator.wakeLock
      .request("screen")
      .then((s) => {
        if (cancelled) {
          s.release();
          return;
        }
        sentinel = s;
      })
      .catch(() => {
        // 取得できなくても調理モード自体は問題なく使えるため、握りつぶす。
      });

    return () => {
      cancelled = true;
      sentinel?.release();
    };
  }, []);

  return null;
}
