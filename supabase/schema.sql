-- OncoCliniq Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- update_updated_at trigger function
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- profiles table
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  full_name       text not null default '',
  role            text not null default 'student' check (role in ('student', 'admin')),
  designation     text not null default '',
  institution     text not null default '',
  specialty       text not null default '',
  date_of_birth          date,
  subscription_status    text not null default 'none',  -- none | trialing | active | past_due | canceled
  subscription_plan      text not null default '',       -- monthly | annual
  subscription_end_date  timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Migration: run these if the table already exists
-- alter table profiles add column if not exists designation            text not null default '';
-- alter table profiles add column if not exists institution            text not null default '';
-- alter table profiles add column if not exists specialty              text not null default '';
-- alter table profiles add column if not exists date_of_birth         date;
-- alter table profiles add column if not exists subscription_status   text not null default 'none';
-- alter table profiles add column if not exists subscription_plan     text not null default '';
-- alter table profiles add column if not exists subscription_end_date timestamptz;
-- alter table profiles add column if not exists stripe_customer_id    text;
-- alter table profiles add column if not exists stripe_subscription_id text;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, full_name, designation, institution, specialty, date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'designation', ''),
    coalesce(new.raw_user_meta_data->>'institution', ''),
    coalesce(new.raw_user_meta_data->>'specialty', ''),
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- questions table
-- ─────────────────────────────────────────────
create table if not exists questions (
  id          text primary key,
  domain      text not null,
  subtopic    text not null default '',
  type        text not null default 'mcq',
  difficulty  text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  level       text not null default 'resident',
  question    text not null,
  options     jsonb not null default '[]',
  correct     integer not null check (correct >= 0 and correct <= 3),
  explanation text not null default '',
  status      text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger questions_updated_at
  before update on questions
  for each row execute function update_updated_at();

create index if not exists questions_domain_idx on questions(domain);
create index if not exists questions_status_idx on questions(status);
create index if not exists questions_domain_status_idx on questions(domain, status);

-- ─────────────────────────────────────────────
-- quiz_attempts table
-- ─────────────────────────────────────────────
create table if not exists quiz_attempts (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references auth.users(id) on delete cascade,
  topic        text not null,
  score        numeric(5,2) not null default 0,
  total        integer not null default 0,
  correct      integer not null default 0,
  question_ids jsonb not null default '[]',
  responses    jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

create index if not exists quiz_attempts_student_idx on quiz_attempts(student_id);
create index if not exists quiz_attempts_topic_idx on quiz_attempts(topic);
create index if not exists quiz_attempts_student_topic_idx on quiz_attempts(student_id, topic);

-- ─────────────────────────────────────────────
-- progress_summary table
-- ─────────────────────────────────────────────
create table if not exists progress_summary (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references auth.users(id) on delete cascade,
  topic          text not null,
  best_score     numeric(5,2) not null default 0,
  attempt_count  integer not null default 0,
  last_attempted timestamptz not null default now(),
  unique (student_id, topic)
);

create index if not exists progress_summary_student_idx on progress_summary(student_id);

-- ─────────────────────────────────────────────
-- chapters table (student reading library)
-- ─────────────────────────────────────────────
create table if not exists chapters (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  slug        text not null unique,
  excerpt     text not null default '',
  content     text not null default '',
  domain      text not null default '',
  subtopic    text not null default '',
  order_index integer not null default 0,
  published   boolean not null default false,
  author_id   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger chapters_updated_at
  before update on chapters
  for each row execute function update_updated_at();

create index if not exists chapters_domain_idx on chapters(domain);
create index if not exists chapters_published_idx on chapters(published);
create index if not exists chapters_slug_idx on chapters(slug);

alter table chapters enable row level security;

create policy "Published chapters visible to authenticated users"
  on chapters for select
  using (auth.role() = 'authenticated' and published = true);

create policy "Admins can do all on chapters"
  on chapters for all
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- blog_posts table
-- ─────────────────────────────────────────────
create table if not exists blog_posts (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  slug        text not null unique,
  content     text not null default '',
  excerpt     text not null default '',
  topic_tag   text not null default '',
  published   boolean not null default false,
  author_id   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

create index if not exists blog_posts_slug_idx on blog_posts(slug);
create index if not exists blog_posts_published_idx on blog_posts(published);
create index if not exists blog_posts_topic_idx on blog_posts(topic_tag);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────

-- profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- questions
alter table questions enable row level security;

create policy "Approved questions visible to authenticated users"
  on questions for select
  using (auth.role() = 'authenticated' and status = 'approved');

create policy "Admins can do all on questions"
  on questions for all
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- quiz_attempts
alter table quiz_attempts enable row level security;

create policy "Students can view own attempts"
  on quiz_attempts for select
  using (auth.uid() = student_id);

create policy "Students can insert own attempts"
  on quiz_attempts for insert
  with check (auth.uid() = student_id);

create policy "Admins can view all attempts"
  on quiz_attempts for select
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- progress_summary
alter table progress_summary enable row level security;

create policy "Students can view own progress"
  on progress_summary for select
  using (auth.uid() = student_id);

create policy "Students can upsert own progress"
  on progress_summary for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "Admins can view all progress"
  on progress_summary for select
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- blog_posts
alter table blog_posts enable row level security;

create policy "Published posts visible to everyone"
  on blog_posts for select
  using (published = true);

create policy "Admins can do all on blog_posts"
  on blog_posts for all
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Seed: promote a user to admin (replace UUID)
-- ─────────────────────────────────────────────
-- update profiles set role = 'admin' where user_id = 'YOUR-USER-UUID-HERE';
