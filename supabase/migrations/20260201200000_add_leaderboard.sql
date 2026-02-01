-- Add leaderboard entries table
-- This table tracks user scores for both featured games (string IDs like "1", "2", "3")
-- and community games (UUID format)

create table public.leaderboard_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- game_id stores the game identifier as text to support both:
  -- - Featured games: "1", "2", "3" (hardcoded string IDs)
  -- - Community games: UUID strings from the games table
  game_id text not null,
  -- Score as percentage (0-100)
  score integer not null default 0,
  -- Current level reached
  current_level integer not null default 1,
  -- Total NPCs defeated
  total_npcs_defeated integer not null default 0,
  -- When this entry was last updated
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- When this entry was created
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Whether the game was completed (100%)
  is_completed boolean not null default false,
  -- Each user can only have one leaderboard entry per game
  unique(user_id, game_id)
);

-- Create indexes for leaderboard queries
create index idx_leaderboard_game_id on public.leaderboard_entries(game_id);
create index idx_leaderboard_score on public.leaderboard_entries(score desc);
create index idx_leaderboard_game_score on public.leaderboard_entries(game_id, score desc);
create index idx_leaderboard_user_id on public.leaderboard_entries(user_id);

-- Enable Row Level Security (RLS)
alter table public.leaderboard_entries enable row level security;

-- Policies for leaderboard_entries table
create policy "Allow public read access on leaderboard_entries" on public.leaderboard_entries
  for select using (true);

create policy "Allow public insert access on leaderboard_entries" on public.leaderboard_entries
  for insert with check (true);

create policy "Allow public update access on leaderboard_entries" on public.leaderboard_entries
  for update using (true);
