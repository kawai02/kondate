import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().nullable(),
  unit: z.string().nullable(),
  is_pantry: z.boolean(),
});

export const stepSchema = z.object({
  order: z.number().int().nonnegative(),
  text: z.string().min(1),
});

export const recipeInputSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  source_type: z.enum(["youtube", "instagram", "photo", "manual"]),
  source_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  raw_text: z.string().nullable(),
  base_servings: z.number().positive().nullable(),
  cook_time_min: z.number().int().positive().nullable(),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
  tags: z.array(z.string().min(1)),
  memo: z.string().nullable(),
  is_planned: z.boolean(),
});

export const menuEntryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipe_id: z.string().uuid(),
  servings: z.number().positive().nullable(),
});

export const copyMenuEntriesInputSchema = z.object({
  sourceStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["weekday", "date"]),
  conflict: z.enum(["overwrite", "skip", "append"]),
});

export const generateShoppingListInputSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const shoppingCategorySchema = z.enum(["野菜", "肉", "魚", "乳製品", "調味料", "その他"]);

export const manualShoppingItemInputSchema = z.object({
  list_id: z.string().uuid(),
  name: z.string().min(1),
  amount: z.number().positive().nullable(),
  unit: z.string().nullable(),
  category: shoppingCategorySchema.nullable(),
});

export const cookingRatingSchema = z.enum(["good", "bad"]);

export const cookingLogInputSchema = z.object({
  recipe_id: z.string().uuid(),
  menu_entry_id: z.string().uuid().nullable(),
  cooked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating: cookingRatingSchema.nullable(),
  comment: z.string().nullable(),
  photo_url: z.string().nullable(),
  author: z.string().nullable(),
});

// Geminiの構造化出力（仕様書5.1）をパースするスキーマ。
// amount/unit/is_pantryが欠けたレスポンスにも耐えるようdefaultを設ける。
export const geminiRecipeSchema = z.object({
  title: z.string(),
  base_servings: z.number().positive().nullable(),
  cook_time_min: z.number().int().positive().nullable(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number().nullable().default(null),
      unit: z.string().nullable().default(null),
      is_pantry: z.boolean().default(false),
    })
  ),
  steps: z.array(z.object({ text: z.string().min(1) })),
  tags: z.array(z.string()),
  confidence: z.enum(["high", "low"]),
  raw_text: z.string().nullable().optional(),
});

export type GeminiRecipeOutput = z.infer<typeof geminiRecipeSchema>;

// 仕様書5.2「手順の人数変更」の出力スキーマ。
export const geminiScaledStepsSchema = z.object({
  steps: z.array(z.object({ text: z.string().min(1) })),
});

export type GeminiScaledStepsOutput = z.infer<typeof geminiScaledStepsSchema>;

// 仕様書5.3「買い物リストの名寄せとカテゴリ分類」の出力スキーマ。
export const geminiNormalizedIngredientsSchema = z.object({
  items: z.array(
    z.object({
      original: z.string(),
      normalized: z.string(),
      category: shoppingCategorySchema,
    })
  ),
});

export type GeminiNormalizedIngredientsOutput = z.infer<typeof geminiNormalizedIngredientsSchema>;

// 仕様書4.13「AI献立提案」の出力スキーマ。recipe_indexはプロンプトに渡した
// レシピ一覧の配列インデックスを指す（uuidを直接渡すとトークンを浪費するため）。
export const geminiWeeklyMenuSchema = z.object({
  assignments: z.array(
    z.object({
      day_offset: z.number().int().min(0).max(6),
      recipe_index: z.number().int().nonnegative(),
      reason: z.string(),
    })
  ),
});

export type GeminiWeeklyMenuOutput = z.infer<typeof geminiWeeklyMenuSchema>;
