-- ============================================
-- Padel Maestro — Initial Database Schema
-- ============================================

-- Profiles (user info from onboarding)
create table profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  height_cm numeric,
  weight_kg numeric,
  age integer,
  playing_level text,
  dominant_hand text,
  preferred_side text,
  racket_sport_background text,
  other_sport_background text,
  playing_frequency text,
  coaching_frequency text,
  available_facilities text[],
  available_classes text[],
  goals text,
  target_level text,
  challenge_duration_days integer default 180,
  start_date date default current_date,
  injuries_or_limitations text,
  dietary_restrictions text[],
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Training plans (AI-generated, stored as JSONB)
create table training_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  plan_data jsonb not null,
  version integer default 1,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, version)
);

alter table training_plans enable row level security;
create policy "Users can read own plans" on training_plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans" on training_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own plans" on training_plans for update using (auth.uid() = user_id);

-- Daily logs
create table daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  status text check (status in ('planned', 'completed', 'modified', 'skipped')),
  feeling text check (feeling in ('great', 'good', 'okay', 'tired', 'pain')),
  process_goal_1 text,
  process_goal_2 text,
  notes text,
  custom_session_title text,
  custom_session_duration text,
  custom_session_focus text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, date)
);

alter table daily_logs enable row level security;
create policy "Users can read own logs" on daily_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on daily_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own logs" on daily_logs for update using (auth.uid() = user_id);

-- Skill ratings (monthly self-assessment)
create table skill_ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  month text not null,
  category text not null,
  skill_name text not null,
  rating integer check (rating >= 1 and rating <= 10),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month, category, skill_name)
);

alter table skill_ratings enable row level security;
create policy "Users can read own ratings" on skill_ratings for select using (auth.uid() = user_id);
create policy "Users can insert own ratings" on skill_ratings for insert with check (auth.uid() = user_id);
create policy "Users can update own ratings" on skill_ratings for update using (auth.uid() = user_id);

-- Fitness benchmarks (monthly tests)
create table fitness_benchmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  month text not null,
  metric_name text not null,
  value numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month, metric_name)
);

alter table fitness_benchmarks enable row level security;
create policy "Users can read own benchmarks" on fitness_benchmarks for select using (auth.uid() = user_id);
create policy "Users can insert own benchmarks" on fitness_benchmarks for insert with check (auth.uid() = user_id);
create policy "Users can update own benchmarks" on fitness_benchmarks for update using (auth.uid() = user_id);

-- Body measurements (monthly)
create table body_measurements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  month text not null,
  metric_name text not null,
  value numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month, metric_name)
);

alter table body_measurements enable row level security;
create policy "Users can read own measurements" on body_measurements for select using (auth.uid() = user_id);
create policy "Users can insert own measurements" on body_measurements for insert with check (auth.uid() = user_id);
create policy "Users can update own measurements" on body_measurements for update using (auth.uid() = user_id);

-- Matches
create table matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  result text,
  opponent_level text,
  partner text,
  is_tournament boolean default false,
  tournament_name text,
  placement text,
  ue_net integer,
  ue_long integer,
  grip_losses integer,
  chiquitas_good integer,
  chiquitas_total integer,
  viboras_good integer,
  viboras_total integer,
  bajadas_good integer,
  bajadas_total integer,
  points_won_net integer,
  points_won_defense integer,
  caught_standing integer,
  backpedaled integer,
  went_well text,
  to_improve text,
  created_at timestamp with time zone default now()
);

alter table matches enable row level security;
create policy "Users can read own matches" on matches for select using (auth.uid() = user_id);
create policy "Users can insert own matches" on matches for insert with check (auth.uid() = user_id);
create policy "Users can update own matches" on matches for update using (auth.uid() = user_id);
create policy "Users can delete own matches" on matches for delete using (auth.uid() = user_id);

-- Journal entries (monthly reflections)
create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  month text not null,
  prompt text not null,
  response text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month, prompt)
);

alter table journal_entries enable row level security;
create policy "Users can read own entries" on journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on journal_entries for update using (auth.uid() = user_id);
