-- Add users table and progress tracking

-- Users table (simple username-based, no auth)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  username text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add creator and visibility to games
alter table public.games 
  add column creator_id uuid references public.users(id) on delete set null,
  add column is_public boolean not null default true;

-- User progress table
create table public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  current_level integer not null default 1,
  defeated_npcs jsonb not null default '[]'::jsonb,
  last_played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Each user can only have one progress record per game
  unique(user_id, game_id)
);

-- Create indexes for better query performance
create index idx_users_username on public.users(username);
create index idx_games_creator_id on public.games(creator_id);
create index idx_games_is_public on public.games(is_public);
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_game_id on public.user_progress(game_id);
create index idx_user_progress_user_game on public.user_progress(user_id, game_id);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.user_progress enable row level security;

-- Policies for users table
create policy "Allow public read access on users" on public.users
  for select using (true);

create policy "Allow public insert access on users" on public.users
  for insert with check (true);

-- Policies for user_progress table
create policy "Allow public read access on user_progress" on public.user_progress
  for select using (true);

create policy "Allow public insert access on user_progress" on public.user_progress
  for insert with check (true);

create policy "Allow public update access on user_progress" on public.user_progress
  for update using (true);

-- Update games policies to handle public/private visibility and new columns
-- Drop existing policies and recreate them
drop policy if exists "Allow public read access on games" on public.games;
drop policy if exists "Allow public insert access on games" on public.games;
drop policy if exists "Allow public update access on games" on public.games;

-- Recreate policies for games table with new columns
create policy "Allow read access on games" on public.games
  for select using (true);

create policy "Allow insert access on games" on public.games
  for insert with check (true);

create policy "Allow update access on games" on public.games
  for update using (true);

-- Note: In production, you'd check creator_id against the current user
-- For now, we allow all operations since we don't have auth
-- The API layer will handle filtering based on username
