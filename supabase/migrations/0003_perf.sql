-- 速度改善（不足インデックス・集計ビュー・RPC）
-- Supabase SQL Editor で実行する。

-- 不足インデックス ---------------------------------------------------------

-- menu_entries: 全クエリが (date, meal_type) で絞り position で並べる
create index menu_entries_date_meal_position_idx
  on menu_entries (date, meal_type, position);

-- cooking_logs: レシピ別履歴と集計を cooked_on 降順で並べる
create index cooking_logs_recipe_cooked_idx
  on cooking_logs (recipe_id, cooked_on desc);

-- recipes: 一覧のデフォルト並び順
create index recipes_created_at_idx on recipes (created_at desc);

-- shopping_lists: 最新1件の取得
create index shopping_lists_created_at_idx on shopping_lists (created_at desc);

-- 調理統計の集計ビュー -------------------------------------------------------
-- レシピ一覧の「しばらく作っていない順」「◯回作った」表示用。
-- 従来はcooking_logs全件をアプリ側に転送しJSで集計していたが、DB側で集計する。

create view recipe_cooking_stats as
  select recipe_id,
         count(*)::int      as count,
         max(cooked_on)     as last_cooked_on
    from cooking_logs
   group by recipe_id;

-- タグ一覧RPC ---------------------------------------------------------------
-- レシピ登録・編集フォームや絞り込みのタグ候補用。
-- 従来は候補を作るためだけに全レシピをSELECT *していた。

create or replace function list_recipe_tags()
returns setof text
language sql stable as $$
  select distinct unnest(tags) from recipes order by 1;
$$;

-- 献立の並び替えRPC ----------------------------------------------------------
-- 上/下ボタンでの並び替え。従来は「全件取得→UPDATE→UPDATE」の4往復かつ
-- 非アトミック（途中失敗でposition重複しうる）だったのを1回のRPC呼び出しに統一する。

create or replace function swap_menu_entry_position(
  p_date date, p_id uuid, p_direction text
) returns void
language plpgsql as $$
declare
  cur record;
  other record;
begin
  select id, position into cur from menu_entries where id = p_id;
  if not found then return; end if;

  if p_direction = 'up' then
    select id, position into other from menu_entries
     where date = p_date and meal_type = 'dinner' and position < cur.position
     order by position desc limit 1;
  else
    select id, position into other from menu_entries
     where date = p_date and meal_type = 'dinner' and position > cur.position
     order by position asc limit 1;
  end if;
  if not found then return; end if;

  update menu_entries set position = other.position where id = cur.id;
  update menu_entries set position = cur.position where id = other.id;
end;
$$;

-- 献立の日付移動RPC -----------------------------------------------------------
-- ドラッグ&ドロップでの日付移動。従来はcount取得→updateの2往復だったのを1回に統一する。

create or replace function move_menu_entry_to_date(
  p_id uuid, p_new_date date
) returns void
language plpgsql as $$
declare
  v_position integer;
begin
  select count(*) into v_position from menu_entries
   where date = p_new_date and meal_type = 'dinner';

  update menu_entries set date = p_new_date, position = v_position where id = p_id;
end;
$$;
