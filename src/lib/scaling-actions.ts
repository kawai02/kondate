"use server";

import { requireSession } from "@/lib/require-session";
import { getRecipe } from "@/lib/recipes";
import { getScaledSteps, saveScaledSteps } from "@/lib/scaled-cache";
import { rewriteStepsForServings, GeminiExtractionError } from "@/lib/gemini";
import { scaleIngredients } from "@/lib/scaling";
import type { Step } from "@/lib/types";

type ActionResult = { ok: true; steps: Step[] } | { ok: false; message: string };

export async function rewriteStepsAction(
  recipeId: string,
  targetServings: number
): Promise<ActionResult> {
  await requireSession();

  const recipe = await getRecipe(recipeId);
  if (!recipe) return { ok: false, message: "レシピが見つからない" };
  if (recipe.base_servings == null) {
    return { ok: false, message: "元の人数が設定されていないため書き換えられない" };
  }

  const cached = await getScaledSteps(recipeId, targetServings);
  if (cached) return { ok: true, steps: cached };

  try {
    const result = await rewriteStepsForServings({
      steps: recipe.steps,
      baseServings: recipe.base_servings,
      targetServings,
    });

    const steps: Step[] = result.steps.map((s, i) => ({ order: i, text: s.text }));
    const scaledIngredients = scaleIngredients(
      recipe.ingredients,
      recipe.base_servings,
      targetServings
    );

    await saveScaledSteps(
      recipeId,
      targetServings,
      scaledIngredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        is_pantry: ing.is_pantry,
      })),
      steps
    );

    return { ok: true, steps };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof GeminiExtractionError ? err.message : "手順の書き換えに失敗した",
    };
  }
}
