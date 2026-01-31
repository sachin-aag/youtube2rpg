-- Create games schema for user-created RPG games

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Games table
create table public.games (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  thumbnail_url text,
  total_chapters integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error'))
);

-- Chapters table
create table public.chapters (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references public.games(id) on delete cascade,
  chapter_number integer not null,
  chapter_title text not null,
  content_preview text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions table
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  explanation text,
  question_type text default 'factual' check (question_type in ('factual', 'opinion', 'conceptual', 'application')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_chapters_game_id on public.chapters(game_id);
create index idx_chapters_game_chapter on public.chapters(game_id, chapter_number);
create index idx_questions_chapter_id on public.questions(chapter_id);

-- Enable Row Level Security (RLS)
alter table public.games enable row level security;
alter table public.chapters enable row level security;
alter table public.questions enable row level security;

-- Create policies for public access (for demo purposes - in production you'd want auth)
create policy "Allow public read access on games" on public.games
  for select using (true);

create policy "Allow public insert access on games" on public.games
  for insert with check (true);

create policy "Allow public update access on games" on public.games
  for update using (true);

create policy "Allow public read access on chapters" on public.chapters
  for select using (true);

create policy "Allow public insert access on chapters" on public.chapters
  for insert with check (true);

create policy "Allow public read access on questions" on public.questions
  for select using (true);

create policy "Allow public insert access on questions" on public.questions
  for insert with check (true);

-- Create storage bucket for thumbnails
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Allow public access to thumbnails
create policy "Allow public read access on thumbnails" on storage.objects
  for select using (bucket_id = 'thumbnails');

create policy "Allow public insert access on thumbnails" on storage.objects
  for insert with check (bucket_id = 'thumbnails');
