"use client";

import { useState, useTransition } from "react";
import { createCookingLogAction } from "@/lib/cooking-log-actions";
import { resizeImage } from "@/lib/resize-image";
import styles from "@/app/_components/kondate-theme.module.css";

export function CookLogForm({
  recipeId,
  menuEntryId,
  existingAuthors,
}: {
  recipeId: string;
  menuEntryId: string | null;
  existingAuthors: string[];
}) {
  const [rating, setRating] = useState<"good" | "bad" | null>(null);
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
      if (rating != null) formData.set("rating", rating);
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
        <h2 className="text-sm font-bold">評価</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRating(rating === "good" ? null : "good")}
            className={`${styles.chunky} ${rating === "good" ? styles.cGreen : styles.cCream} h-11 flex-1 text-sm`}
          >
            😋 おいしかった
          </button>
          <button
            type="button"
            onClick={() => setRating(rating === "bad" ? null : "bad")}
            className={`${styles.chunky} ${rating === "bad" ? styles.cPink : styles.cCream} h-11 flex-1 text-sm`}
          >
            🙁 イマイチ
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="comment">
          コメント
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="前回は塩辛かったので今回は控えめに、など"
          className={`${styles.searchInput} w-full px-3 py-2 text-base`}
        />
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="photo">
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
          <img
            src={photoPreview}
            alt=""
            className="h-32 w-32 rounded-xl border-2 border-[var(--outline)] object-cover"
          />
        )}
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="author">
          記入者
        </label>
        <input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="自分・パートナー など"
          className={`${styles.searchInput} h-11 w-full px-3 text-base`}
        />
        {existingAuthors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingAuthors.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAuthor(a)}
                className={`${styles.tagChip} h-8 px-3 text-xs`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <p className={`${styles.dangerLink} text-sm`}>{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base disabled:opacity-50`}
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </div>
  );
}
