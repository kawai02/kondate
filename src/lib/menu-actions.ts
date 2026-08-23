"use server";

import { revalidatePath } from "next/cache";
import { menuEntryInputSchema } from "@/lib/schemas";
import { addMenuEntry, deleteMenuEntry, moveMenuEntry, moveMenuEntryToDate } from "@/lib/menu";
import { requireSession } from "@/lib/require-session";

export async function addMenuEntryAction(input: {
  date: string;
  recipe_id: string;
  servings: number | null;
}) {
  await requireSession();
  const parsed = menuEntryInputSchema.parse(input);
  await addMenuEntry(parsed);
  revalidatePath("/");
  revalidatePath("/recipes");
}

// RecipePickerSheetのonPickにdateを束縛して渡すための薄いラッパー。
// bind(null, date)で (recipeId) => Promise<void> の形になり、onPickの型と合う。
export async function addMenuEntryForDateAction(date: string, recipeId: string) {
  await addMenuEntryAction({ date, recipe_id: recipeId, servings: null });
}

export async function deleteMenuEntryAction(id: string) {
  await requireSession();
  await deleteMenuEntry(id);
  revalidatePath("/");
}

export async function moveMenuEntryAction(date: string, id: string, direction: "up" | "down") {
  await requireSession();
  await moveMenuEntry(date, id, direction);
  revalidatePath("/");
}

export async function moveMenuEntryToDateAction(id: string, newDate: string) {
  await requireSession();
  await moveMenuEntryToDate(id, newDate);
  revalidatePath("/");
}
