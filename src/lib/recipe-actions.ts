"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { recipeInputSchema } from "@/lib/schemas";
import { createRecipe, deleteRecipe, updateRecipe } from "@/lib/recipes";
import { requireSession } from "@/lib/require-session";
import type { Ingredient, SourceType, Step } from "@/lib/types";

function parseRecipeFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const sourceTypeRaw = String(formData.get("source_type") ?? "manual");
  const sourceUrlRaw = formData.get("source_url");
  const thumbnailUrlRaw = formData.get("thumbnail_url");
  const rawTextRaw = formData.get("raw_text");
  const baseServingsRaw = formData.get("base_servings");
  const cookTimeRaw = formData.get("cook_time_min");
  const memoRaw = formData.get("memo");
  const tagsRaw = String(formData.get("tags") ?? "");
  const ingredientsRaw = String(formData.get("ingredients_json") ?? "[]");
  const stepsRaw = String(formData.get("steps_json") ?? "[]");
  const isPlanned = formData.get("is_planned") === "on";

  const ingredients = JSON.parse(ingredientsRaw) as Ingredient[];
  const steps = JSON.parse(stepsRaw) as Step[];
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return recipeInputSchema.parse({
    title,
    source_type: sourceTypeRaw as SourceType,
    source_url: sourceUrlRaw ? String(sourceUrlRaw) : null,
    thumbnail_url: thumbnailUrlRaw ? String(thumbnailUrlRaw) : null,
    raw_text: rawTextRaw ? String(rawTextRaw) : null,
    base_servings: baseServingsRaw ? Number(baseServingsRaw) : null,
    cook_time_min: cookTimeRaw ? Number(cookTimeRaw) : null,
    ingredients,
    steps: steps.map((s, i) => ({ ...s, order: i })),
    tags,
    memo: memoRaw ? String(memoRaw) : null,
    is_planned: isPlanned,
  });
}

export async function createRecipeAction(formData: FormData) {
  await requireSession();
  const input = parseRecipeFormData(formData);
  const recipe = await createRecipe(input);
  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipeAction(id: string, formData: FormData) {
  await requireSession();
  const input = parseRecipeFormData(formData);
  await updateRecipe(id, input);
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string) {
  await requireSession();
  await deleteRecipe(id);
  revalidatePath("/recipes");
  redirect("/recipes");
}
