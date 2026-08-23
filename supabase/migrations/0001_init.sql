-- 献立管理アプリ 初期スキーマ（仕様書セクション3）
-- Supabase SQL Editor で実行する。

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- recipes ---------------------------------------------------------------

create table recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_type   text not null check (source_type in ('youtube', 'instagram', 'photo', 'manual')),
  source_url    text,
  thumbnail_url text,
  raw_text      text,
  base_servings numeric,
  ingredients   jsonb not null default '[]'::jsonb,
  steps         jsonb not null default '[]'::jsonb,
  cook_time_min integer,
  tags          text[] not null default '{}'::text[],
  memo          text,
  is_planned    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger recipes_set_updated_at
  before update on recipes
  for each row
  execute function set_updated_at();

create index recipes_tags_idx on recipes using gin (tags);
create index recipes_ingredients_idx on recipes using gin (ingredients);
create index recipes_title_idx on recipes using gin (to_tsvector('simple', title));

alter table recipes enable row level security;

-- recipe_scaled_cache -----------------------------------------------------

create table recipe_scaled_cache (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  servings    numeric not null,
  ingredients jsonb not null,
  steps       jsonb not null,
  created_at  timestamptz not null default now(),
  unique (recipe_id, servings)
);

alter table recipe_scaled_cache enable row level security;

-- menu_entries ------------------------------------------------------------

create table menu_entries (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  meal_type  text not null default 'dinner' check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id  uuid not null references recipes(id) on delete cascade,
  servings   numeric,
  position   integer not null default 0,
  note       text
);

create index menu_entries_date_idx on menu_entries(date);

alter table menu_entries enable row level security;

-- cooking_logs --------------------------------------------------------------

create table cooking_logs (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete cascade,
  menu_entry_id uuid references menu_entries(id) on delete set null,
  cooked_on     date not null,
  rating        integer check (rating between 1 and 5),
  comment       text,
  photo_url     text,
  author        text,
  created_at    timestamptz not null default now()
);

create index cooking_logs_recipe_id_idx on cooking_logs(recipe_id);

alter table cooking_logs enable row level security;

-- shopping_lists ------------------------------------------------------------

create table shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now()
);

alter table shopping_lists enable row level security;

-- shopping_items -------------------------------------------------------------

create table shopping_items (
  id                uuid primary key default gen_random_uuid(),
  list_id           uuid not null references shopping_lists(id) on delete cascade,
  name              text not null,
  amount            numeric,
  unit              text,
  category          text check (category in ('野菜', '肉', '魚', '乳製品', '調味料', 'その他')),
  checked           boolean not null default false,
  source_recipe_ids uuid[] not null default '{}'::uuid[],
  is_manual         boolean not null default false
);

create index shopping_items_list_id_idx on shopping_items(list_id);

alter table shopping_items enable row level security;
