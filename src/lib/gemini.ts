import "server-only";
import {
  geminiRecipeSchema,
  geminiScaledStepsSchema,
  geminiNormalizedIngredientsSchema,
  geminiWeeklyMenuSchema,
  type GeminiRecipeOutput,
  type GeminiScaledStepsOutput,
  type GeminiNormalizedIngredientsOutput,
  type GeminiWeeklyMenuOutput,
} from "@/lib/schemas";
import { INITIAL_TAGS } from "@/lib/tags";
import type { Step } from "@/lib/types";

// 構造化出力（responseSchema）を使うと生成に時間がかかることがあり、
// 特に画像入力では8秒では不足するケースがあった。Vercelにデプロイする際は
// このタイムアウトより長い maxDuration をページ側で設定すること。
const TIMEOUT_MS = 25000;

export class GeminiExtractionError extends Error {}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

// Gemini API (v1beta generateContent) を叩く共通関数。
// レシピ抽出・人数変更の手順書き換え・材料名の名寄せの3用途で共有する。
async function callGemini(parts: Part[], responseSchema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiExtractionError("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new GeminiExtractionError(`Gemini API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new GeminiExtractionError("Gemini APIから空のレスポンスが返った");

    return JSON.parse(stripCodeFence(text));
  } finally {
    clearTimeout(timeout);
  }
}

// 呼び出し元ごとのzodスキーマでパースさせ、失敗時は1回だけリトライする共通ラッパー。
async function callGeminiWithRetry<T>(
  parts: Part[],
  responseSchema: object,
  parse: (raw: unknown) => T
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callGemini(parts, responseSchema);
      return parse(raw);
    } catch (err) {
      lastError = err;
    }
  }

  throw new GeminiExtractionError(
    lastError instanceof Error ? lastError.message : "AIによる処理に失敗した"
  );
}

// --- レシピ抽出（仕様書5.1） ---------------------------------------------

type ExtractInput =
  | { kind: "text"; text: string }
  | { kind: "images"; images: { mimeType: string; base64: string }[] };

// Gemini API (v1beta generateContent) が要求するJSON Schema形式（OpenAPI準拠、type名は大文字）。
// geminiRecipeSchema（src/lib/schemas.ts）と対応させる。
const RECIPE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    base_servings: { type: "NUMBER", nullable: true },
    cook_time_min: { type: "INTEGER", nullable: true },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          amount: { type: "NUMBER", nullable: true },
          unit: { type: "STRING", nullable: true },
          is_pantry: { type: "BOOLEAN" },
        },
        required: ["name", "is_pantry"],
      },
    },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { text: { type: "STRING" } },
        required: ["text"],
      },
    },
    tags: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "STRING", enum: ["high", "low"] },
    raw_text: { type: "STRING", nullable: true },
  },
  required: ["title", "base_servings", "cook_time_min", "ingredients", "steps", "tags", "confidence"],
};

function buildExtractPrompt(hasImages: boolean): string {
  return `あなたは料理レシピの構造化を行うアシスタント。与えられた${
    hasImages ? "料理本や写真の画像" : "テキスト"
  }からレシピを抽出し、指定のJSONスキーマで返す。

厳守事項:
- 元の${hasImages ? "画像" : "テキスト"}に書かれていない材料や手順を創作しない。
- 人数が明記されていない場合は base_servings を null にする（推測しない）。
- 砂糖・塩・醤油・味噌・油・酒・みりん・こしょう等の基本調味料は is_pantry を true にする。
- 情報が不足している場合は confidence を "low" にする。
- tags は次の候補から当てはまるものを優先的に選ぶ（無理に当てはめなくてよい、自由な語も可）: ${INITIAL_TAGS.join("、")}
${hasImages ? "- raw_text には画像に写っている文字をできるだけそのまま書き起こして入れる。" : ""}`;
}

export async function extractRecipe(input: ExtractInput): Promise<GeminiRecipeOutput> {
  const parts: Part[] = [{ text: buildExtractPrompt(input.kind === "images") }];
  if (input.kind === "text") {
    parts.push({ text: input.text });
  } else {
    for (const image of input.images) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }
  }

  return callGeminiWithRetry(parts, RECIPE_RESPONSE_SCHEMA, (raw) =>
    geminiRecipeSchema.parse(raw)
  );
}

// --- 手順の人数変更（仕様書5.2） ------------------------------------------

const SCALED_STEPS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { text: { type: "STRING" } },
        required: ["text"],
      },
    },
  },
  required: ["steps"],
};

export async function rewriteStepsForServings(params: {
  steps: Step[];
  baseServings: number;
  targetServings: number;
}): Promise<GeminiScaledStepsOutput> {
  const prompt = `以下は${params.baseServings}人前のレシピ手順。これを${params.targetServings}人前に書き換える。

厳守事項:
- 分量に関する数字（大さじ・ml・g・個数など）は${params.targetServings}人前に合わせて書き換える。
- 加熱時間・冷蔵時間・温度は人数に比例しないため変更しない。
- 調理器具のサイズに言及がある場合、必要なら「フライパンが小さければ2回に分けて」等の注記を添えてよい。
- 手順の数・順序は変えない。

元の手順（${params.baseServings}人前）:
${params.steps.map((s, i) => `${i + 1}. ${s.text}`).join("\n")}`;

  return callGeminiWithRetry([{ text: prompt }], SCALED_STEPS_RESPONSE_SCHEMA, (raw) =>
    geminiScaledStepsSchema.parse(raw)
  );
}

// --- 買い物リストの名寄せとカテゴリ分類（仕様書5.3） ------------------------

const NORMALIZED_INGREDIENTS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          original: { type: "STRING" },
          normalized: { type: "STRING" },
          category: {
            type: "STRING",
            enum: ["野菜", "肉", "魚", "乳製品", "調味料", "その他"],
          },
        },
        required: ["original", "normalized", "category"],
      },
    },
  },
  required: ["items"],
};

export async function normalizeIngredientNames(
  names: string[]
): Promise<GeminiNormalizedIngredientsOutput> {
  const prompt = `以下は買い物リストに使う材料名の一覧。表記ゆれ（例: 玉ねぎ／たまねぎ／玉葱）を正規化し、それぞれを売り場カテゴリに分類する。

- normalized は表記ゆれをまとめた統一名にする（同じ食材は同じnormalizedにする）。
- category は 野菜・肉・魚・乳製品・調味料・その他 のいずれか1つ。

材料名一覧:
${names.map((n) => `- ${n}`).join("\n")}`;

  return callGeminiWithRetry(
    [{ text: prompt }],
    NORMALIZED_INGREDIENTS_RESPONSE_SCHEMA,
    (raw) => geminiNormalizedIngredientsSchema.parse(raw)
  );
}

// --- AI献立提案（仕様書4.13） ---------------------------------------------

const WEEKLY_MENU_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    assignments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day_offset: { type: "INTEGER" },
          recipe_index: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["day_offset", "recipe_index", "reason"],
      },
    },
  },
  required: ["assignments"],
};

export type WeeklyMenuCandidate = {
  title: string;
  tags: string[];
  cookTimeMin: number | null;
  lastCookedOn: string | null;
};

export type WeeklyMenuDay = {
  dayOffset: number;
  date: string;
  weekday: string;
  isWeekend: boolean;
};

export async function suggestWeeklyMenu(params: {
  candidates: WeeklyMenuCandidate[];
  days: WeeklyMenuDay[];
}): Promise<GeminiWeeklyMenuOutput> {
  const recipeList = params.candidates
    .map(
      (c, i) =>
        `${i}: ${c.title} / タグ:${c.tags.join(",") || "なし"} / 調理時間:${c.cookTimeMin ?? "不明"}分 / 最終調理日:${c.lastCookedOn ?? "未調理"}`
    )
    .join("\n");

  const dayList = params.days
    .map((d) => `${d.dayOffset}: ${d.date}（${d.weekday}${d.isWeekend ? "・週末" : ""}）`)
    .join("\n");

  const prompt = `以下のレシピ一覧から、7日分の献立を1日1品ずつ選ぶ。

厳守事項:
- 肉料理と魚料理が偏らないようにする。
- 最終調理日が直近1ヶ月以内のレシピは避ける（未調理のものは優先候補にしてよい）。
- 平日は調理時間が短いものを、週末は手の込んだものを優先する。
- 同じレシピを週内で重複させない。
- day_offsetは0〜6の7日すべてに1件ずつ割り当てる。
- recipe_indexはレシピ一覧の行頭の番号をそのまま使う。
- reasonには、なぜその日にそのレシピを選んだかを一言で書く。

レシピ一覧（番号: タイトル / タグ / 調理時間 / 最終調理日）:
${recipeList}

対象の7日間（day_offset: 日付（曜日））:
${dayList}`;

  return callGeminiWithRetry(
    [{ text: prompt }],
    WEEKLY_MENU_RESPONSE_SCHEMA,
    (raw) => geminiWeeklyMenuSchema.parse(raw)
  );
}
