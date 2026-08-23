"use client";

import { useState, useTransition } from "react";
import { createCookingLogAction } from "@/lib/cooking-log-actions";
import { resizeImage } from "@/lib/resize-image";

export function CookLogForm({
  recipeId,
  menuEntryId,
  existingAuthors,
}: {
  recipeId: string;
  menuEntryId: string | null;
  existingAuthors: string[];
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    try {
      const resized = await resizeImage(file);
      setPhoto(resized);
      setPhotoPreview(URL.createObjectURL(resized));
    } catch {
      setError("写真の処理に失敗した");
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("recipe_id", recipeId);
      if (menuEntryId) formData.set("menu_entry_id", menuEntryId);
      if (rating != null) formData.set("rating", String(rating));
      if (comment.trim()) formData.set("comment", comment);
      if (author.trim()) formData.set("author", author);
      if (photo) formData.set("photo", photo);

      try {
        await createCookingLogAction(formData);
      } catch (err) {
        // redirect()はNEXT_REDIRECT例外を投げて正常遷移するので、それ以外だけエラー扱いにする
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setError("保存に失敗した");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium">評価</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              className={`h-11 w-11 rounded-lg border text-sm font-medium ${
                rating != null && n <= rating
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/20 dark:border-white/20"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="comment">
          コメント
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="前回は塩辛かったので今回は控えめに、など"
          className="w-full rounded-lg border border-black/20 px-3 py-2 text-base dark:border-white/20 dark:bg-transparent"
        />
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="photo">
          完成写真（任意）
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="h-32 w-32 rounded-lg object-cover" />
        )}
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="author">
          記入者
        </label>
        <input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="自分・パートナー など"
          className="h-11 w-full rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
        />
        {existingAuthors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingAuthors.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAuthor(a)}
                className="h-8 rounded-full border border-black/20 px-3 text-xs dark:border-white/20"
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </div>
  );
}
