-- ============================================
-- Collabo-Connect Database Schema
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. profiles (users)
-- ============================================
-- Supabase Auth のユーザーと紐づくプロフィールテーブル
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text default '',
  role text default '',
  areas text[] default '{}',
  tags text[] default '{}',
  ai_intro text default '',
  joined_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;

-- 誰でもプロフィールを閲覧可能
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 自分のプロフィールのみ更新可能
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 自分のプロフィールのみ挿入可能
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- 2. postings (掲示板の投稿)
-- ============================================
create table public.postings (
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

alter table public.postings enable row level security;

-- 誰でも投稿を閲覧可能
create policy "Postings are viewable by everyone"
  on public.postings for select
  using (true);

-- ログインユーザーは投稿を作成可能
create policy "Authenticated users can create postings"
  on public.postings for insert
  with check (auth.uid() = creator_id);

-- 作成者のみ更新可能
create policy "Creators can update own postings"
  on public.postings for update
  using (auth.uid() = creator_id);

-- 作成者のみ削除可能
create policy "Creators can delete own postings"
  on public.postings for delete
  using (auth.uid() = creator_id);

-- ============================================
-- 3. posting_participants (投稿への参加者)
-- ============================================
create table public.posting_participants (
  id uuid primary key default uuid_generate_v4(),
  posting_id uuid not null references public.postings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('join', 'interested', 'online')),
  created_at timestamptz default now(),
  unique (posting_id, user_id)
);

alter table public.posting_participants enable row level security;

-- 誰でも参加情報を閲覧可能
create policy "Participants are viewable by everyone"
  on public.posting_participants for select
  using (true);

-- ログインユーザーは自分の参加を追加可能
create policy "Users can add own participation"
  on public.posting_participants for insert
  with check (auth.uid() = user_id);

-- 自分の参加のみ更新可能
create policy "Users can update own participation"
  on public.posting_participants for update
  using (auth.uid() = user_id);

-- 自分の参加のみ削除可能
create policy "Users can delete own participation"
  on public.posting_participants for delete
  using (auth.uid() = user_id);

-- ============================================
-- 4. ai_questions (AIインタビュー質問)
-- ============================================
create table public.ai_questions (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  options text[] default '{}',
  date date default current_date,
  created_at timestamptz default now()
);

alter table public.ai_questions enable row level security;

-- 誰でも質問を閲覧可能
create policy "Questions are viewable by everyone"
  on public.ai_questions for select
  using (true);

-- ============================================
-- 5. ai_question_responses (質問への回答)
-- ============================================
create table public.ai_question_responses (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.ai_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null,
  created_at timestamptz default now(),
  unique (question_id, user_id)
);

alter table public.ai_question_responses enable row level security;

-- 誰でも回答を閲覧可能
create policy "Responses are viewable by everyone"
  on public.ai_question_responses for select
  using (true);

-- ログインユーザーは自分の回答を追加可能
create policy "Users can add own response"
  on public.ai_question_responses for insert
  with check (auth.uid() = user_id);

-- 自分の回答のみ更新可能
create policy "Users can update own response"
  on public.ai_question_responses for update
  using (auth.uid() = user_id);

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

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger postings_updated_at
  before update on public.postings
  for each row execute function public.handle_updated_at();

-- ============================================
-- Trigger: 新規ユーザー登録時にプロフィールを自動作成
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
