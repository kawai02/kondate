export type Ingredient = {
  name: string;
  amount: number | null;
  unit: string | null;
  is_pantry: boolean;
};

export type Step = {
  order: number;
  text: string;
};

export type SourceType = "youtube" | "instagram" | "photo" | "manual" | "blog";

export type Recipe = {
  id: string;
  title: string;
  source_type: SourceType;
  source_url: string | null;
  thumbnail_url: string | null;
  raw_text: string | null;
  base_servings: number | null;
  ingredients: Ingredient[];
  steps: Step[];
  cook_time_min: number | null;
  tags: string[];
  memo: string | null;
  is_planned: boolean;
  created_at: string;
  updated_at: string;
};

// RecipeFormが新規/編集/取り込みの3経路で共用する入力型。
// Recipeからid/created_at/updated_atを除いた形なので、
// Recipe型の値はそのままRecipeFormValuesとして渡せる。
export type RecipeInput = Omit<Recipe, "id" | "created_at" | "updated_at">;
export type RecipeFormValues = RecipeInput;

export type MealType = "breakfast" | "lunch" | "dinner";

export type MenuEntry = {
  id: string;
  date: string;
  meal_type: MealType;
  recipe_id: string;
  servings: number | null;
  position: number;
  note: string | null;
};

export type MenuEntryWithRecipe = MenuEntry & {
  recipe: Pick<
    Recipe,
    "id" | "title" | "tags" | "base_servings" | "cook_time_min" | "thumbnail_url"
  >;
};

export type RecipeSort = "new" | "cook_time" | "last_cooked";

// 一覧・ピッカー・ドラッグパネル・AI提案など、全文（raw_text/ingredients/steps）が
// 不要な画面向けの軽量版。listRecipeSummariesが返す。
export type RecipeSummary = Pick<
  Recipe,
  "id" | "title" | "tags" | "cook_time_min" | "thumbnail_url" | "is_planned" | "created_at"
>;

export type CookingRating = "good" | "bad";

export type CookingLog = {
  id: string;
  recipe_id: string;
  menu_entry_id: string | null;
  cooked_on: string;
  rating: CookingRating | null;
  comment: string | null;
  photo_url: string | null;
  author: string | null;
  created_at: string;
};

export type ShoppingCategory = "野菜" | "肉" | "魚" | "乳製品" | "調味料" | "その他";

export type ShoppingList = {
  id: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type ShoppingItem = {
  id: string;
  list_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  category: ShoppingCategory | null;
  checked: boolean;
  source_recipe_ids: string[];
  is_manual: boolean;
  is_pantry: boolean;
};

export type CookingLogInput = {
  recipe_id: string;
  menu_entry_id: string | null;
  cooked_on: string;
  rating: CookingRating | null;
  comment: string | null;
  photo_url: string | null;
  author: string | null;
};
