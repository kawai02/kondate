import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { CookingStats } from "@/lib/cooking-logs";
import type { Ingredient, Recipe, RecipeInput, RecipeSort, RecipeSummary } from "@/lib/types";

type ListRecipesOptions = {
  tags?: string[];
  q?: string;
  sort?: RecipeSort;
  planned?: boolean;
};

// last_cooked順のソートに使う統計。呼び出し側で既に取得済みのMapを渡せば
// cooking_logsの再スキャンを避けられる。
function sortByLastCooked<T extends { id: string }>(
  items: T[],
  statsMap: Map<string, CookingStats>
): T[] {
  return [...items].sort((a, b) => {
    const aLast = statsMap.get(a.id)?.lastCookedOn ?? null;
    const bLast = statsMap.get(b.id)?.lastCookedOn ?? null;
    if (aLast == null && bLast == null) return 0;
    if (aLast == null) return -1;
    if (bLast == null) return 1;
    return aLast.localeCompare(bLast);
  });
}

// 一覧・ピッカー・ドラッグパネル・AI提案用の軽量版。raw_text/steps を積まないので、
// 全レシピを毎回転送する画面での転送量を大きく減らせる。
// q（レシピ名・材料名検索）が指定されたときだけingredientsも取得し、
// タイトル・材料名の部分一致をJS側で判定する（jsonb配列の中身の検索はPostgRESTの
// 高レベルフィルタでは表現できないため）。
export async function listRecipeSummaries(
  options: ListRecipesOptions & { statsMap?: Map<string, CookingStats> } = {}
): Promise<RecipeSummary[]> {
  const supabase = getSupabase();
  // supabase-jsはselect()の列文字列をリテラル型として解析するため、
  // 型を保ったまま列を出し分けるにはリテラルごとに分岐する必要がある。
  let query = options.q
    ? supabase
        .from("recipes")
        .select("id, title, tags, cook_time_min, thumbnail_url, is_planned, created_at, ingredients")
    : supabase
        .from("recipes")
        .select("id, title, tags, cook_time_min, thumbnail_url, is_planned, created_at");

  if (options.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags);
  }
  if (options.planned) {
    query = query.eq("is_planned", true);
  }

  if (options.sort === "cook_time") {
    query = query.order("cook_time_min", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  let recipes = (data ?? []) as (RecipeSummary & { ingredients?: Ingredient[] })[];

  if (options.q) {
    const q = options.q.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.ingredients ?? []).some((i) => i.name.toLowerCase().includes(q))
    );
  }

  if (options.sort === "last_cooked" && options.statsMap) {
    recipes = sortByLastCooked(recipes, options.statsMap);
  }

  return recipes.map((r) => ({
    id: r.id,
    title: r.title,
    tags: r.tags,
    cook_time_min: r.cook_time_min,
    thumbnail_url: r.thumbnail_url,
    is_planned: r.is_planned,
    created_at: r.created_at,
  }));
}

// タグ絞り込み画面のタグ候補一覧。全レシピを取得せず、DB側のRPCでタグだけ集める。
export async function listAllTags(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("list_recipe_tags");
  if (error) throw error;
  return (data ?? []) as string[];
}

// YouTube取り込み時の重複チェック用。source_urlはfetchYouTubeMetadataAction側で
// https://www.youtube.com/watch?v=<videoId> の形に正規化してから保存・検索する。
export async function findRecipeBySourceUrl(
  sourceUrl: string
): Promise<{ id: string; title: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Recipe | null;
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as Recipe;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

export async function setRecipePlanned(id: string, isPlanned: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("recipes")
    .update({ is_planned: isPlanned })
    .eq("id", id);
  if (error) throw error;
}
