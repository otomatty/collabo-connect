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
create table if not exists public.profiles (
  id uuid primary key,
  name text not null,
  avatar_url text default '',
  role text default '',
  areas text[] default '{}',
  tags text[] default '{}',
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
