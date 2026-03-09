-- Add session_type and focus to daily_activities
alter table daily_activities add column session_type text;
alter table daily_activities add column focus text;
