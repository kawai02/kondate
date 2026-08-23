import "server-only";
import { getSupabase } from "@/lib/supabase";
import { listMenuEntries } from "@/lib/menu";
import { scaleIngredients } from "@/lib/scaling";
import { normalizeIngredientNames } from "@/lib/gemini";
import type { Ingredient, ShoppingCategory, ShoppingItem, ShoppingList } from "@/lib/types";

export type ShoppingListWithItems = ShoppingList & { items: ShoppingItem[] };

type ExpandedIngredient = Ingredient & { recipeId: string };

async function expandIngredientsForRange(
  startDate: string,
  endDate: string
): Promise<ExpandedIngredient[]> {
  const entries = await listMenuEntries(startDate, endDate);
  if (entries.length === 0) return [];

  const recipeIds = Array.from(new Set(entries.map((e) => e.recipe_id)));
  const supabase = getSupabase();
  const { data: recipeRows, error } = await supabase
    .from("recipes")
    .select("id, ingredients, base_servings")
    .in("id", recipeIds);
  if (error) throw error;

  const recipeMap = new Map((recipeRows ?? []).map((r) => [r.id, r]));

  const expanded: ExpandedIngredient[] = [];
  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipe_id);
    if (!recipe) continue;

    const targetServings = entry.servings ?? recipe.base_servings;
    const ingredients =
      recipe.base_servings != null && targetServings != null
        ? scaleIngredients(recipe.ingredients as Ingredient[], recipe.base_servings, targetServings)
        : (recipe.ingredients as Ingredient[]);

    for (const ing of ingredients) {
      expanded.push({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        is_pantry: ing.is_pantry,
        recipeId: entry.recipe_id,
      });
    }
  }
  return expanded;
}

type AggregatedItem = {
  name: string;
  amount: number | null;
  unit: string | null;
  category: ShoppingCategory | null;
  is_pantry: boolean;
  source_recipe_ids: Set<string>;
};

export async function generateShoppingList(
  startDate: string,
  endDate: string
): Promise<ShoppingListWithItems> {
  const expanded = await expandIngredientsForRange(startDate, endDate);

  let normalizedByName = new Map<string, { normalized: string; category: ShoppingCategory }>();
  if (expanded.length > 0) {
    const uniqueNames = Array.from(new Set(expanded.map((e) => e.name)));
    const normalized = await normalizeIngredientNames(uniqueNames);
    normalizedByName = new Map(
      normalized.items.map((item) => [item.original, { normalized: item.normalized, category: item.category }])
    );
  }

  // (正規化後の名前, 単位) をキーに集約する。単位が異なる材料は合算せず別行のまま残す（仕様書4.8）。
  const aggregated = new Map<string, AggregatedItem>();
  for (const ing of expanded) {
    const mapped = normalizedByName.get(ing.name);
    const normalizedName = mapped?.normalized ?? ing.name;
    const category = mapped?.category ?? null;
    const key = `${normalizedName}::${ing.unit ?? ""}`;

    const existing = aggregated.get(key);
    if (existing) {
      existing.amount =
        existing.amount != null && ing.amount != null ? existing.amount + ing.amount : (existing.amount ?? ing.amount);
      existing.is_pantry = existing.is_pantry || ing.is_pantry;
      existing.source_recipe_ids.add(ing.recipeId);
    } else {
      aggregated.set(key, {
        name: normalizedName,
        amount: ing.amount,
        unit: ing.unit,
        category,
        is_pantry: ing.is_pantry,
        source_recipe_ids: new Set([ing.recipeId]),
      });
    }
  }

  const supabase = getSupabase();
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ start_date: startDate, end_date: endDate })
    .select("*")
    .single();
  if (listError) throw listError;

  const itemsToInsert = Array.from(aggregated.values()).map((item) => ({
    list_id: list.id,
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    category: item.category,
    checked: false,
    source_recipe_ids: Array.from(item.source_recipe_ids),
    is_manual: false,
    is_pantry: item.is_pantry,
  }));

  let items: ShoppingItem[] = [];
  if (itemsToInsert.length > 0) {
    const { data, error } = await supabase.from("shopping_items").insert(itemsToInsert).select("*");
    if (error) throw error;
    items = (data ?? []) as ShoppingItem[];
  }

  return { ...(list as ShoppingList), items };
}

export async function getLatestShoppingList(): Promise<ShoppingListWithItems | null> {
  const supabase = getSupabase();
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (listError) throw listError;
  if (!list) return null;

  const { data: items, error: itemsError } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("list_id", list.id)
    .order("category", { ascending: true });
  if (itemsError) throw itemsError;

  return { ...(list as ShoppingList), items: (items ?? []) as ShoppingItem[] };
}

export async function toggleShoppingItem(id: string, checked: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("shopping_items").update({ checked }).eq("id", id);
  if (error) throw error;
}

export async function addManualItem(
  listId: string,
  input: { name: string; amount: number | null; unit: string | null; category: ShoppingCategory | null }
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("shopping_items").insert({
    list_id: listId,
    name: input.name,
    amount: input.amount,
    unit: input.unit,
    category: input.category,
    checked: false,
    source_recipe_ids: [],
    is_manual: true,
    is_pantry: false,
  });
  if (error) throw error;
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}
