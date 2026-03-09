-- Add cost_usd to daily_logs and daily_activities
alter table daily_logs add column cost_usd numeric;
alter table daily_activities add column cost_usd numeric;
