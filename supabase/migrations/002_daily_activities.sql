-- ============================================
-- Daily Activities (extra activities per day)
-- ============================================

create table daily_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  description text not null,
  comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index daily_activities_user_date on daily_activities (user_id, date);

alter table daily_activities enable row level security;
create policy "Users can read own activities" on daily_activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on daily_activities for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on daily_activities for update using (auth.uid() = user_id);
create policy "Users can delete own activities" on daily_activities for delete using (auth.uid() = user_id);
