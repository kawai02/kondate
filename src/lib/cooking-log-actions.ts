"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { cookingLogInputSchema } from "@/lib/schemas";
import { createCookingLog, deleteCookingLog } from "@/lib/cooking-logs";
import { uploadImageBuffer } from "@/lib/storage";

export async function createCookingLogAction(formData: FormData) {
  await requireSession();

  const recipeId = String(formData.get("recipe_id") ?? "");
  const menuEntryIdRaw = formData.get("menu_entry_id");
  const ratingRaw = formData.get("rating");
  const commentRaw = formData.get("comment");
  const authorRaw = formData.get("author");
  const photo = formData.get("photo");

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    photoUrl = await uploadImageBuffer(buffer, photo.type || "image/jpeg");
  }

  const today = new Date();
  const cookedOn = new Date(today.getTime() - today.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const input = cookingLogInputSchema.parse({
    recipe_id: recipeId,
    menu_entry_id: menuEntryIdRaw ? String(menuEntryIdRaw) : null,
    cooked_on: cookedOn,
    rating: ratingRaw ? String(ratingRaw) : null,
    comment: commentRaw ? String(commentRaw) : null,
    photo_url: photoUrl,
    author: authorRaw ? String(authorRaw) : null,
  });

  await createCookingLog(input);
  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

export async function deleteCookingLogAction(id: string, recipeId: string) {
  await requireSession();
  await deleteCookingLog(id);
  revalidatePath(`/recipes/${recipeId}`);
}
