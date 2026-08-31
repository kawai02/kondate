"use server";

import { requireSession } from "@/lib/require-session";
import { parseYouTubeVideoId, fetchVideoSnippet } from "@/lib/youtube";
import { normalizeAmebloUrl, isBlogUrl, fetchBlogArticle } from "@/lib/ameblo";
import { uploadImageFromUrl, uploadImageBuffer, deleteImageByUrl } from "@/lib/storage";
import { extractRecipe, GeminiExtractionError } from "@/lib/gemini";
import { findRecipeBySourceUrl } from "@/lib/recipes";
import type { GeminiRecipeOutput } from "@/lib/schemas";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type YouTubeMetadata = {
  title: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
};

export type FetchYouTubeMetadataResult =
  | { ok: true; data: YouTubeMetadata }
  | { ok: false; message: string; duplicateRecipeId?: string };

export async function fetchYouTubeMetadataAction(
  url: string
): Promise<FetchYouTubeMetadataResult> {
  await requireSession();

  const videoId = parseYouTubeVideoId(url);
  if (!videoId) {
    return { ok: false, message: "YouTubeのURLとして認識できなかった" };
  }

  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 同じ動画を二重に取り込まないよう、YouTube APIを叩く前にチェックする。
  const existing = await findRecipeBySourceUrl(sourceUrl);
  if (existing) {
    return {
      ok: false,
      message: `この動画は既に取り込み済み（「${existing.title}」）`,
      duplicateRecipeId: existing.id,
    };
  }

  try {
    const snippet = await fetchVideoSnippet(videoId);
    // 元動画が削除・非公開になってもレシピが失われないよう、サムネイルを自前のStorageに保存する。
    const thumbnailUrl = await uploadImageFromUrl(snippet.thumbnailUrl);
    return {
      ok: true,
      data: {
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl,
        sourceUrl,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "取得に失敗した",
    };
  }
}

export type BlogArticleMetadata = {
  title: string;
  text: string;
  thumbnailUrl: string | null;
  sourceUrl: string;
  isAmeblo: boolean;
};

export type FetchBlogArticleResult =
  | { ok: true; data: BlogArticleMetadata }
  | { ok: false; message: string; duplicateRecipeId?: string };

export async function fetchBlogArticleAction(
  url: string
): Promise<FetchBlogArticleResult> {
  await requireSession();

  const trimmed = url.trim();
  const canonical = normalizeAmebloUrl(trimmed);
  if (!canonical && !isBlogUrl(trimmed)) {
    return { ok: false, message: "ブログ記事のURLを入力してほしい" };
  }
  const sourceUrl = canonical ?? trimmed;

  // 同じ記事を二重に取り込まないよう、取得前にチェックする。
  const existing = await findRecipeBySourceUrl(sourceUrl);
  if (existing) {
    return {
      ok: false,
      message: `この記事は既に取り込み済み（「${existing.title}」）`,
      duplicateRecipeId: existing.id,
    };
  }

  try {
    const article = await fetchBlogArticle(trimmed);
    // 元記事が消えてもレシピが失われないよう、アイキャッチを自前のStorageに保存する。
    // 画像は必須でないため、失敗しても取り込みは続行する。
    let thumbnailUrl: string | null = null;
    if (article.imageUrl) {
      thumbnailUrl = await uploadImageFromUrl(article.imageUrl).catch(() => null);
    }
    return {
      ok: true,
      data: {
        title: article.title,
        text: article.text,
        thumbnailUrl,
        // 重複チェックに使ったURLをそのまま保存し、キーの一貫性を保つ。
        sourceUrl,
        isAmeblo: article.isAmeblo,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "記事を取得できなかった",
    };
  }
}

// クライアントで90°回転させた画像を受け取り、Storageに保存し直して新しいURLを返す。
// レシピ編集・取り込みプレビューの「回転」ボタンから呼ばれる。
export async function uploadRotatedImageAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  await requireSession();

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { ok: false, message: "画像が渡されていない" };
  }
  const oldUrl = formData.get("old_url");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageBuffer(buffer, file.type || "image/jpeg");
    if (typeof oldUrl === "string" && oldUrl) {
      await deleteImageByUrl(oldUrl).catch(() => {});
    }
    return { ok: true, data: { url } };
  } catch {
    return { ok: false, message: "画像の回転に失敗した" };
  }
}

export async function extractFromTextAction(
  text: string
): Promise<ActionResult<GeminiRecipeOutput>> {
  await requireSession();

  if (!text.trim()) {
    return { ok: false, message: "テキストが空" };
  }

  try {
    const result = await extractRecipe({ kind: "text", text });
    return { ok: true, data: { ...result, raw_text: result.raw_text ?? text } };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof GeminiExtractionError
          ? err.message
          : "AIによる解析に失敗した。手動で入力してほしい",
    };
  }
}

export type PhotoExtractionResult = GeminiRecipeOutput & { thumbnail_url: string | null };

export async function extractFromPhotosAction(
  formData: FormData
): Promise<ActionResult<PhotoExtractionResult>> {
  await requireSession();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false, message: "写真が選択されていない" };
  }

  try {
    const images = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return { buffer, mimeType: file.type || "image/jpeg" };
      })
    );

    const result = await extractRecipe({
      kind: "images",
      images: images.map((img) => ({
        mimeType: img.mimeType,
        base64: img.buffer.toString("base64"),
      })),
    });

    // 保存するのは代表1枚のみ（見開き2枚目以降の情報はraw_textに文字起こしとして残る）。
    const thumbnailUrl = await uploadImageBuffer(images[0].buffer, images[0].mimeType);

    return { ok: true, data: { ...result, thumbnail_url: thumbnailUrl } };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof GeminiExtractionError
          ? err.message
          : "AIによる解析に失敗した。手動で入力してほしい",
    };
  }
}
