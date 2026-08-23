-- 買い物リストの常備品トグル対応（仕様書4.8）
-- 0001_init.sql の shopping_items にはこのフラグが無かったため追加する。
-- Supabase SQL Editor で実行する。

alter table shopping_items add column is_pantry boolean not null default false;
