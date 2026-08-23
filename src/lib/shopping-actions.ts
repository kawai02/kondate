"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import {
  generateShoppingListInputSchema,
  manualShoppingItemInputSchema,
} from "@/lib/schemas";
import {
  generateShoppingList,
  toggleShoppingItem,
  addManualItem,
  deleteShoppingItem,
} from "@/lib/shopping";
import { GeminiExtractionError } from "@/lib/gemini";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function generateShoppingListAction(
  startDate: string,
  endDate: string
): Promise<ActionResult> {
  await requireSession();
  const parsed = generateShoppingListInputSchema.parse({ startDate, endDate });

  try {
    await generateShoppingList(parsed.startDate, parsed.endDate);
    revalidatePath("/shopping");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof GeminiExtractionError
          ? err.message
          : "買い物リストの生成に失敗した",
    };
  }
}

export async function toggleShoppingItemAction(id: string, checked: boolean) {
  await requireSession();
  await toggleShoppingItem(id, checked);
  revalidatePath("/shopping");
}

export async function addManualItemAction(formData: FormData) {
  await requireSession();
  const input = manualShoppingItemInputSchema.parse({
    list_id: String(formData.get("list_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    amount: formData.get("amount") ? Number(formData.get("amount")) : null,
    unit: formData.get("unit") ? String(formData.get("unit")) : null,
    category: formData.get("category") ? String(formData.get("category")) : null,
  });
  await addManualItem(input.list_id, {
    name: input.name,
    amount: input.amount,
    unit: input.unit,
    category: input.category,
  });
  revalidatePath("/shopping");
}

export async function deleteShoppingItemAction(id: string) {
  await requireSession();
  await deleteShoppingItem(id);
  revalidatePath("/shopping");
}
