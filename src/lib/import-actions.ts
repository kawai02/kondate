"use server";

import { requireSession } from "@/lib/require-session";
import { parseYouTubeVideoId, fetchVideoSnippet } from "@/lib/youtube";
import { uploadImageFromUrl, uploadImageBuffer } from "@/lib/storage";
import { extractRecipe, GeminiExtractionError } from "@/lib/gemini";
import type { GeminiRecipeOutput } from "@/lib/schemas";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type YouTubeMetadata = {
  title: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
};

export async function fetchYouTubeMetadataAction(
  url: string
): Promise<ActionResult<YouTubeMetadata>> {
  await requireSession();

  const videoId = parseYouTubeVideoId(url);
  if (!videoId) {
    return { ok: false, message: "YouTubeのURLとして認識できなかった" };
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
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "取得に失敗した",
    };
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
