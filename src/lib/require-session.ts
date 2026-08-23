import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Server Actionsはページと同じルートへのPOSTとして扱われるため、
// proxyのmatcher変更やリファクタで保護が静かに外れうる
// (Next.js 16 proxy.mdの「Data Security guide」参照)。
// proxy任せにせず各Server Function内でも検証する。
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("unauthorized");
  }
}
