-- レシピの取り込み元に「ブログ(blog)」を追加する。
-- Supabase SQL Editor で実行する。

-- recipes.source_type にかかっているcheck制約は名前が環境によって異なる可能性があるため、
-- 動的に探して削除してから貼り直す。
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'recipes'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source_type%'
  loop
    execute format('alter table recipes drop constraint %I', con.conname);
  end loop;
end $$;

alter table recipes
  add constraint recipes_source_type_check
  check (source_type in ('youtube', 'instagram', 'photo', 'manual', 'blog'));
