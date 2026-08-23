"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { copyMenuEntriesInputSchema } from "@/lib/schemas";
import { copyMenuEntries } from "@/lib/menu-copy";

export async function copyMenuEntriesAction(input: {
  sourceStart: string;
  sourceEnd: string;
  targetStart: string;
  mode: "weekday" | "date";
  conflict: "overwrite" | "skip" | "append";
}): Promise<{ copied: number; skipped: number }> {
  await requireSession();
  const parsed = copyMenuEntriesInputSchema.parse(input);
  const result = await copyMenuEntries(parsed);
  revalidatePath("/");
  return result;
}
