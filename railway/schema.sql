-- ============================================
-- Collabo Connect Database Schema (Railway Postgres)
-- ============================================
-- auth.users 非依存・RLS なし。権限は API 層で JWT の sub に基づき実施。

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. profiles (users)
-- ============================================
-- id は Supabase Auth の user id (UUID) と一致させる。API で挿入。
-- tags は tags / profile_tags テーブルへ移行済み（Phase 1）。
create table if not exists public.profiles (
  id uuid primary key,
  name text not null,
  avatar_url text default '',
  role text default '',
  areas text[] default '{}',
  job_type text default '' not null,
  ai_intro text default '',
  joined_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. postings (掲示板の投稿)
-- ============================================
create table if not exists public.postings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null check (category in ('food', 'study', 'event')),
  date date,
  date_undecided boolean default false,
  area text not null,
  is_online boolean default false,
  description text default '',
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 3. posting_participants (投稿への参加者)
-- ============================================
create table if not exists public.posting_participants (
  id uuid primary key default uuid_generate_v4(),
  posting_id uuid not null references public.postings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('join', 'interested', 'online')),
  created_at timestamptz default now(),
  unique (posting_id, user_id)
);

-- ============================================
-- 4. ai_questions (AIインタビュー質問)
-- ============================================
create table if not exists public.ai_questions (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  options text[] default '{}',
  date date default current_date,
  created_at timestamptz default now()
);

-- ============================================
-- 5. ai_question_responses (質問への回答)
-- ============================================
create table if not exists public.ai_question_responses (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.ai_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null,
  created_at timestamptz default now(),
  unique (question_id, user_id)
);

-- ============================================
-- 6. tags (タグ辞書)
-- ============================================
-- タグの正規化単位。name は大文字小文字を区別せずユニーク（lower(name) に一意索引）。
-- aliases で表記ゆれを吸収し、"React" / "react" / "REACT" は同一レコードへ解決される。
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  aliases text[] default '{}',
  category text not null default 'other'
    check (category in ('skill', 'hobby', 'area', 'role', 'other')),
  usage_count int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Case-insensitive uniqueness: upsertTag uses `ON CONFLICT ((lower(name)))`.
-- 古い case-sensitive な tags_name_key 制約が残っている環境はまずそれを外す。
alter table public.tags drop constraint if exists tags_name_key;
create unique index if not exists tags_name_lower_unique_idx on public.tags (lower(name));
create index if not exists tags_category_idx on public.tags (category);
create index if not exists tags_usage_count_idx on public.tags (usage_count desc);

-- ============================================
-- 7. profile_tags (プロフィール ↔ タグの多対多)
-- ============================================
-- source: manual = ユーザーが自分で追加 / auto = AIエージェントが自動適用（high信頼度）
--         そのほか interview / daily_question / posting は Phase 2 で導入
create table if not exists public.profile_tags (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  source text not null default 'manual'
    check (source in ('manual', 'auto', 'interview', 'daily_question', 'posting')),
  created_at timestamptz default now(),
  primary key (profile_id, tag_id)
);

create index if not exists profile_tags_tag_id_idx on public.profile_tags (tag_id);

-- ============================================
-- 8. suggested_tags (AIエージェントが提案中のタグ承認待ちキュー)
-- ============================================
-- confidence medium のタグ、または新規タグ (tag_id is null / proposed_name 指定) が入る。
-- status が pending の間だけマイページに表示。accepted で profile_tags に反映、
-- proposed_name 指定だった場合はここで初めて tags テーブルへ INSERT される。
create table if not exists public.suggested_tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  proposed_name text,
  proposed_category text not null default 'other'
    check (proposed_category in ('skill', 'hobby', 'area', 'role', 'other')),
  source text not null
    check (source in ('interview', 'daily_question', 'posting')),
  confidence text not null check (confidence in ('high', 'medium')),
  reason text default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  resolved_at timestamptz,
  check (tag_id is not null or proposed_name is not null)
);

create index if not exists suggested_tags_user_status_idx
  on public.suggested_tags (user_id, status);
create index if not exists suggested_tags_tag_id_idx
  on public.suggested_tags (tag_id) where tag_id is not null;

-- ============================================
-- Helper: プロフィールに紐づくタグ名一覧
-- ============================================
create or replace function public.get_profile_tags(p_id uuid)
returns text[] as $$
  select coalesce(array_agg(t.name order by t.name), '{}'::text[])
  from public.profile_tags pt
  join public.tags t on t.id = pt.tag_id
  where pt.profile_id = p_id;
$$ language sql stable;

-- ============================================
-- Migration: profiles.tags (text[]) → tags / profile_tags
-- ============================================
-- 既存環境でカラムが残っている場合のみ実行。新規環境では何もしない。
do $$
declare
  rec record;
  raw_name text;
  cleaned text;
  new_tag_id uuid;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'tags'
  ) then
    for rec in execute 'select id, tags from public.profiles where tags is not null and cardinality(tags) > 0'
    loop
      foreach raw_name in array rec.tags
      loop
        cleaned := btrim(raw_name);
        if cleaned = '' then
          continue;
        end if;
        insert into public.tags (name, created_by, category)
        values (cleaned, rec.id, 'other')
        on conflict ((lower(name))) do nothing;
        select id into new_tag_id from public.tags where lower(name) = lower(cleaned);
        insert into public.profile_tags (profile_id, tag_id, source)
        values (rec.id, new_tag_id, 'manual')
        on conflict (profile_id, tag_id) do nothing;
      end loop;
    end loop;

    -- usage_count を更新
    update public.tags t
       set usage_count = sub.cnt
      from (
        select tag_id, count(*)::int as cnt
        from public.profile_tags
        group by tag_id
      ) sub
     where t.id = sub.tag_id;

    alter table public.profiles drop column tags;
  end if;
end $$;

-- ============================================
-- Trigger: updated_at の自動更新
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists postings_updated_at on public.postings;
create trigger postings_updated_at
  before update on public.postings
  for each row execute function public.handle_updated_at();

drop trigger if exists tags_updated_at on public.tags;
create trigger tags_updated_at
  before update on public.tags
  for each row execute function public.handle_updated_at();
