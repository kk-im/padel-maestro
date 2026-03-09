-- Ensure comment column exists on daily_activities (idempotent)
alter table daily_activities add column if not exists comment text;
