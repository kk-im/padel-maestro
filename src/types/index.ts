// --- Session & feeling enums ---

export type SessionType = "coach" | "gym" | "match" | "recovery" | "rest" | "drilling" | "tournament" | "americano";
export type SessionStatus = "planned" | "completed" | "modified" | "skipped";
export type Feeling = "great" | "good" | "okay" | "tired" | "pain";

// --- AI-generated plan types (stored as JSONB in training_plans.plan_data) ---

export interface SessionTemplate {
  type: SessionType;
  title: string;
  duration: string;
  focus: string;
  icon: string;
}

export interface Phase {
  number: number;
  name: string;
  description: string;
  start_day: number;
  end_day: number;
  weekly_schedule: Record<string, SessionTemplate>;
  technical_priorities: string[];
  milestones: { technical: string; physical: string };
}

export interface PlanData {
  phases: Phase[];
  skill_categories: Record<string, string[]>;
  fitness_metrics: Record<string, { name: string; how: string }[]>;
  body_metrics: string[];
  journal_prompts: string[];
}

// --- Database table types ---

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  playing_level: string | null;
  dominant_hand: string | null;
  preferred_side: string | null;
  racket_sport_background: string | null;
  other_sport_background: string | null;
  playing_frequency: string | null;
  coaching_frequency: string | null;
  available_facilities: string[] | null;
  available_classes: string[] | null;
  goals: string | null;
  target_level: string | null;
  challenge_duration_days: number;
  start_date: string;
  injuries_or_limitations: string | null;
  dietary_restrictions: string[] | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  plan_data: PlanData;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  status: SessionStatus | null;
  feeling: Feeling | null;
  process_goal_1: string | null;
  process_goal_2: string | null;
  notes: string | null;
  custom_session_title: string | null;
  custom_session_duration: string | null;
  custom_session_focus: string | null;
  cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface SkillRating {
  id: string;
  user_id: string;
  month: string;
  category: string;
  skill_name: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface FitnessBenchmark {
  id: string;
  user_id: string;
  month: string;
  metric_name: string;
  value: number | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  month: string;
  metric_name: string;
  value: number | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  date: string;
  result: string | null;
  opponent_level: string | null;
  partner: string | null;
  is_tournament: boolean;
  tournament_name: string | null;
  placement: string | null;
  ue_net: number | null;
  ue_long: number | null;
  grip_losses: number | null;
  chiquitas_good: number | null;
  chiquitas_total: number | null;
  viboras_good: number | null;
  viboras_total: number | null;
  bajadas_good: number | null;
  bajadas_total: number | null;
  points_won_net: number | null;
  points_won_defense: number | null;
  caught_standing: number | null;
  backpedaled: number | null;
  went_well: string | null;
  to_improve: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  month: string;
  prompt: string;
  response: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  date: string;
  description: string;
  session_type: string | null;
  focus: string | null;
  comment: string | null;
  duration_minutes: number | null;
  cost_usd: number | null;
  created_at: string;
  updated_at: string;
}
