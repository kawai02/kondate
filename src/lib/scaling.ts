import type { Ingredient } from "@/lib/types";

// 仕様書4.5「材料の分量は比例計算で算出（AIを使わない。計算誤差を避けるため）」を担う純関数。
// サーバー・クライアントの両方から呼ぶため server-only は付けない。

export type ScaledIngredient = Ingredient & { originalAmount: number | null };

function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scaleIngredients(
  ingredients: Ingredient[],
  baseServings: number,
  targetServings: number
): ScaledIngredient[] {
  const ratio = targetServings / baseServings;

  return ingredients.map((ingredient) => {
    if (ingredient.amount == null) {
      return { ...ingredient, originalAmount: null };
    }
    return {
      ...ingredient,
      amount: roundToOneDecimal(ingredient.amount * ratio),
      originalAmount: ingredient.amount,
    };
  });
}
