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

export async function deleteCookingLog(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("cooking_logs").delete().eq("id", id);
  if (error) throw error;
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

// 仕様書4.4・4.12「調理回数」「最終調理日」。recipe_cooking_stats(DB側の集計ビュー)を使う。
export async function getCookingStats(recipeId: string): Promise<CookingStats> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipe_cooking_stats")
    .select("count, last_cooked_on")
    .eq("recipe_id", recipeId)
    .maybeSingle();
  if (error) throw error;

  return {
    count: data?.count ?? 0,
    lastCookedOn: data?.last_cooked_on ?? null,
  };
}

// レシピ一覧の「しばらく作っていない順」並び替えとカード表示用。
// recipe_cooking_stats(DB側でGROUP BY済みのビュー)から取得するので、
// cooking_logs全件をアプリ側に転送する必要がない。
export async function getCookingStatsMap(): Promise<Map<string, CookingStats>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipe_cooking_stats")
    .select("recipe_id, count, last_cooked_on");
  if (error) throw error;

  const map = new Map<string, CookingStats>();
  for (const row of data ?? []) {
    map.set(row.recipe_id, { count: row.count, lastCookedOn: row.last_cooked_on });
  }
  return map;
}
