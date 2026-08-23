import "server-only";
import { getSupabase } from "@/lib/supabase";
import { getCookingStatsMap } from "@/lib/cooking-logs";
import type { Recipe, RecipeInput, RecipeSort } from "@/lib/types";

type ListRecipesOptions = {
  tags?: string[];
  q?: string;
  sort?: RecipeSort;
};

export async function listRecipes(options: ListRecipesOptions = {}): Promise<Recipe[]> {
  const supabase = getSupabase();
  let query = supabase.from("recipes").select("*");

  if (options.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags);
  }

  if (options.sort === "cook_time") {
    query = query.order("cook_time_min", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  let recipes = (data ?? []) as Recipe[];

  // 材料名の部分一致検索はjsonb配列の中身を見る必要があるため、
  // 少人数利用の想定件数（数百件程度）を前提にアプリ側でフィルタする。
  if (options.q) {
    const q = options.q.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }

  // 仕様書4.12「しばらく作っていない順」。一度も作っていないレシピを先頭に置き、
  // 次に最終調理日が古い順に並べる。
  if (options.sort === "last_cooked") {
    const statsMap = await getCookingStatsMap();
    recipes = [...recipes].sort((a, b) => {
      const aLast = statsMap.get(a.id)?.lastCookedOn ?? null;
      const bLast = statsMap.get(b.id)?.lastCookedOn ?? null;
      if (aLast == null && bLast == null) return 0;
      if (aLast == null) return -1;
      if (bLast == null) return 1;
      return aLast.localeCompare(bLast);
    });
  }

  return recipes;
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
