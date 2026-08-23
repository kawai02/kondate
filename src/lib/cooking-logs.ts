import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { CookingLog, CookingLogInput } from "@/lib/types";

export async function listCookingLogs(recipeId: string): Promise<CookingLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cooking_logs")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("cooked_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CookingLog[];
}

export async function createCookingLog(input: CookingLogInput): Promise<CookingLog> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cooking_logs")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as CookingLog;
}

// 感想記録の「記入者」欄で、過去に使ったラベルをチップとしてサジェストするための一覧。
export async function listAuthors(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cooking_logs")
    .select("author")
    .not("author", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const authors = (data ?? [])
    .map((row) => row.author)
    .filter((a): a is string => !!a && a.trim().length > 0);
  return Array.from(new Set(authors));
}

export type CookingStats = { count: number; lastCookedOn: string | null };

// 仕様書4.4・4.12「調理回数」「最終調理日」。
export async function getCookingStats(recipeId: string): Promise<CookingStats> {
  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from("cooking_logs")
    .select("cooked_on", { count: "exact" })
    .eq("recipe_id", recipeId)
    .order("cooked_on", { ascending: false })
    .limit(1);
  if (error) throw error;

  return {
    count: count ?? 0,
    lastCookedOn: data?.[0]?.cooked_on ?? null,
  };
}

// レシピ一覧の「しばらく作っていない順」並び替えとカード表示用。
// 一覧で1件ずつgetCookingStatsを呼ぶとN+1になるため、全件取得してJS側で集計する。
export async function getCookingStatsMap(): Promise<Map<string, CookingStats>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cooking_logs")
    .select("recipe_id, cooked_on")
    .order("cooked_on", { ascending: false });
  if (error) throw error;

  const map = new Map<string, CookingStats>();
  for (const row of data ?? []) {
    const existing = map.get(row.recipe_id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(row.recipe_id, { count: 1, lastCookedOn: row.cooked_on });
    }
  }
  return map;
}
