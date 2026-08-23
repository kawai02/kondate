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
      "id, date, meal_type, recipe_id, servings, position, note, recipe:recipes(id, title, tags, base_servings, cook_time_min)"
    )
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MenuEntryWithRecipe[];
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
    .eq("id", input.recipe_id);
  if (updateError) throw updateError;
}

// 月グリッドでのドラッグ＆ドロップによる日付移動用。
// 移動先の末尾にpositionを採番する方式はaddMenuEntryと揃えている。
export async function moveMenuEntryToDate(id: string, newDate: string): Promise<void> {
  const supabase = getSupabase();

  const { count, error: countError } = await supabase
    .from("menu_entries")
    .select("id", { count: "exact", head: true })
    .eq("date", newDate)
    .eq("meal_type", "dinner");
  if (countError) throw countError;

  const { error } = await supabase
    .from("menu_entries")
    .update({ date: newDate, position: count ?? 0 })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMenuEntry(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("menu_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function moveMenuEntry(
  date: string,
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("menu_entries")
    .select("id, position")
    .eq("date", date)
    .eq("meal_type", "dinner")
    .order("position", { ascending: true });
  if (error) throw error;

  const entries = data ?? [];
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= entries.length) return;

  const a = entries[index];
  const b = entries[swapIndex];

  const { error: errA } = await supabase
    .from("menu_entries")
    .update({ position: b.position })
    .eq("id", a.id);
  if (errA) throw errA;

  const { error: errB } = await supabase
    .from("menu_entries")
    .update({ position: a.position })
    .eq("id", b.id);
  if (errB) throw errB;
}
