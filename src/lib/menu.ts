import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { MenuEntryWithRecipe } from "@/lib/types";

export async function listMenuEntries(
  startDate: string,
  endDate: string
): Promise<MenuEntryWithRecipe[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("menu_entries")
    .select(
      "id, date, meal_type, recipe_id, servings, position, note, recipe:recipes(id, title, tags, base_servings, cook_time_min, thumbnail_url)"
    )
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MenuEntryWithRecipe[];
}

// 買い物リスト生成専用。ingredients/base_servingsまで一度のjoinで取得することで、
// 献立取得後に別途recipesをin()で引き直す往復を無くす。
export async function listMenuEntriesWithIngredients(
  startDate: string,
  endDate: string
): Promise<
  Array<{
    date: string;
    recipe_id: string;
    servings: number | null;
    recipe: { ingredients: unknown; base_servings: number | null };
  }>
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("menu_entries")
    .select("date, recipe_id, servings, recipe:recipes(ingredients, base_servings)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    date: string;
    recipe_id: string;
    servings: number | null;
    recipe: { ingredients: unknown; base_servings: number | null };
  }>;
}

export async function addMenuEntry(input: {
  date: string;
  recipe_id: string;
  servings: number | null;
}): Promise<void> {
  const supabase = getSupabase();

  const { count, error: countError } = await supabase
    .from("menu_entries")
    .select("id", { count: "exact", head: true })
    .eq("date", input.date)
    .eq("meal_type", "dinner");
  if (countError) throw countError;

  const { error: insertError } = await supabase.from("menu_entries").insert({
    date: input.date,
    meal_type: "dinner",
    recipe_id: input.recipe_id,
    servings: input.servings,
    position: count ?? 0,
  });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("recipes")
    .update({ is_planned: false })
    .eq("id", input.recipe_id)
    .eq("is_planned", true);
  if (updateError) throw updateError;
}

// AI提案の一括確定などで複数件を追加する場合に使う。日付ごとにpositionをまとめて
// 採番してから1回のinsertでまとめて書き込むことで、件数分の往復を無くす。
export async function addMenuEntries(
  inputs: Array<{ date: string; recipe_id: string; servings: number | null }>
): Promise<void> {
  if (inputs.length === 0) return;
  const supabase = getSupabase();

  const dates = Array.from(new Set(inputs.map((i) => i.date)));
  const { data: existing, error: existingError } = await supabase
    .from("menu_entries")
    .select("date")
    .in("date", dates)
    .eq("meal_type", "dinner");
  if (existingError) throw existingError;

  const nextPositionByDate = new Map<string, number>();
  for (const row of existing ?? []) {
    nextPositionByDate.set(row.date, (nextPositionByDate.get(row.date) ?? 0) + 1);
  }

  const rows = inputs.map((input) => {
    const position = nextPositionByDate.get(input.date) ?? 0;
    nextPositionByDate.set(input.date, position + 1);
    return {
      date: input.date,
      meal_type: "dinner" as const,
      recipe_id: input.recipe_id,
      servings: input.servings,
      position,
    };
  });

  const { error: insertError } = await supabase.from("menu_entries").insert(rows);
  if (insertError) throw insertError;

  const recipeIds = Array.from(new Set(inputs.map((i) => i.recipe_id)));
  const { error: updateError } = await supabase
    .from("recipes")
    .update({ is_planned: false })
    .in("id", recipeIds)
    .eq("is_planned", true);
  if (updateError) throw updateError;
}

// 月グリッドでのドラッグ＆ドロップによる日付移動用。
// 移動先の末尾にpositionを採番する処理はDB側のRPCに寄せ、1往復にする。
export async function moveMenuEntryToDate(id: string, newDate: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("move_menu_entry_to_date", {
    p_id: id,
    p_new_date: newDate,
  });
  if (error) throw error;
}

export async function deleteMenuEntry(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("menu_entries").delete().eq("id", id);
  if (error) throw error;
}

// 上/下ボタンでの並び替え。従来はJS側で「全件取得→2回UPDATE」していたが、
// DB側のRPCに寄せて1往復・アトミックにする。
export async function moveMenuEntry(
  date: string,
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("swap_menu_entry_position", {
    p_date: date,
    p_id: id,
    p_direction: direction,
  });
  if (error) throw error;
}
