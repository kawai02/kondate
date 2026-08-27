-- 感想記録の評価を1〜5段階から「おいしかった/イマイチ」の二択に変更する。
-- Supabase SQL Editor で実行する。

-- 既存のcheck制約は名前が環境によって異なる可能性があるため、
-- cooking_logs.rating にかかっているcheck制約を動的に探して削除する。
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'cooking_logs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%rating%'
  loop
    execute format('alter table cooking_logs drop constraint %I', con.conname);
  end loop;
end $$;

-- 既存データの引き継ぎ: 3以上を「おいしかった(good)」、それ未満を「イマイチ(bad)」とみなす。
alter table cooking_logs
  alter column rating type text
  using (
    case
      when rating >= 3 then 'good'
      when rating is not null then 'bad'
      else null
    end
  );

alter table cooking_logs
  add constraint cooking_logs_rating_check check (rating in ('good', 'bad'));
