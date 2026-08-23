import { format } from "date-fns";
import { requireSession } from "@/lib/require-session";
import { getSupabase } from "@/lib/supabase";

// Route Handlerにはsrc/app/layout.tsxのdynamic設定が効かないため個別に指定する。
export const dynamic = "force-dynamic";

const TABLES = [
  "recipes",
  "menu_entries",
  "cooking_logs",
  "shopping_lists",
  "shopping_items",
  "recipe_scaled_cache",
] as const;

export async function GET() {
  try {
    await requireSession();
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const data: Record<string, unknown> = {};

  for (const table of TABLES) {
    const { data: rows, error } = await supabase.from(table).select("*");
    if (error) {
      return Response.json({ error: `${table}の取得に失敗した` }, { status: 500 });
    }
    data[table] = rows;
  }

  const filename = `kondate-export-${format(new Date(), "yyyy-MM-dd")}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
