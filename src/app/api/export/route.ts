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

  // 6テーブルの全件ダンプを並列化する（従来はテーブルごとに逐次await）。
  const results = await Promise.all(
    TABLES.map(async (table) => {
      const rows: unknown[] = [];
      // PostgRESTのデフォルト行数上限に引っかからないようページングする。
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data: page, error } = await supabase
          .from(table)
          .select("*")
          .range(offset, offset + pageSize - 1);
        if (error) return { table, error };
        rows.push(...(page ?? []));
        if (!page || page.length < pageSize) break;
      }
      return { table, rows };
    })
  );

  for (const result of results) {
    if ("error" in result && result.error) {
      return Response.json({ error: `${result.table}の取得に失敗した` }, { status: 500 });
    }
    data[result.table] = "rows" in result ? result.rows : [];
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
