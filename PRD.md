# Padel Progress+ — Product Requirements Document

## 1. Product Overview

### 1.1 What Is It?
Padel Progress+ is a mobile-first AI-powered training companion for padel players at any level. When a user signs up, they go through an onboarding flow that captures their skill level, goals, available facilities, and physical profile. The app then uses Claude AI to generate a fully personalized multi-phase training plan — including weekly schedules, skill categories to track, fitness benchmarks, and journal prompts tailored to their situation.

### 1.2 Problem
Padel players who want to improve have no structured, personalized way to plan training, track skill progression, log match stats, and reflect on their journey. Generic training plans don't account for individual differences in level, facilities, coaching access, or physical limitations.

### 1.3 Solution
A PWA that generates a completely personalized training plan via AI, then provides daily session guidance, skill tracking, fitness benchmarks, match logging, and journaling — all adapted to the individual player. The plan adjusts to what facilities they have, how often they can train, and what level they're starting from.

### 1.4 Target User
- Padel players at any level who want structured improvement
- Players who track their training seriously but don't want complex tools
- Anyone doing a time-bound padel improvement challenge (90 days, 6 months, 365 days)

### 1.5 Business Model
- Free: Onboarding + plan generation + first 7 days of full access
- Paid: $5/month for continued access to all features
- Future: one-time plan regeneration for $2 (when they want to update their plan mid-challenge)

### 1.6 Success Metrics
- Onboarding completion rate
- Daily active usage (opens app and logs something every training day)
- Monthly skill assessment completion rate
- Match logging rate
- Subscription conversion rate (free trial → paid)

---

## 2. Technical Architecture

### 2.1 Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (free tier — PostgreSQL + Auth + Realtime)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514) for plan generation
- **Deployment:** Vercel (free tier)
- **PWA:** @ducanh2912/next-pwa for service worker + manifest
- **Auth:** Supabase Auth (email magic link)

### 2.2 Why PWA?
- Zero App Store fees
- Single codebase for web + mobile
- Instant deploys via Vercel
- Installable on home screen
- Can upgrade to native later using Capacitor

### 2.3 Why Supabase?
- Free tier: 500MB database, 50K MAUs, 1GB file storage
- Built-in auth with magic link
- PostgreSQL with Row Level Security
- Easy setup, great docs, works perfectly with Next.js

### 2.4 Project Structure
```
padel-progress-plus/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing/auth page
│   │   ├── onboarding/page.tsx       # Multi-step onboarding
│   │   ├── auth/callback/route.ts
│   │   ├── api/generate-plan/route.ts  # Claude AI plan generation
│   │   ├── (app)/
│   │   │   ├── layout.tsx            # App shell with bottom nav
│   │   │   ├── today/page.tsx
│   │   │   ├── plan/page.tsx
│   │   │   ├── skills/page.tsx
│   │   │   ├── fitness/page.tsx
│   │   │   ├── matches/page.tsx
│   │   │   └── journal/page.tsx
│   ├── components/ui/
│   ├── hooks/
│   │   ├── useProfile.ts
│   │   ├── useTrainingPlan.ts
│   │   ├── useDay.ts
│   │   ├── useDailyLog.ts
│   │   ├── useSkills.ts
│   │   ├── useFitness.ts
│   │   ├── useMatches.ts
│   │   └── useJournal.ts
│   ├── lib/
│   │   ├── supabase/
│   │   ├── data/constants.ts
│   │   └── utils/dates.ts
│   └── types/index.ts
├── .env.local
├── PRD.md
└── package.json
```

---

## 3. Database Schema

### 3.1 Tables

**profiles** — User info collected during onboarding
- id (uuid, references auth.users, primary key)
- name, email, height_cm, weight_kg, age
- playing_level, dominant_hand, preferred_side
- racket_sport_background, other_sport_background
- playing_frequency, coaching_frequency
- available_facilities (text array), available_classes (text array)
- goals, target_level, challenge_duration_days, start_date
- injuries_or_limitations, dietary_restrictions (text array)
- onboarding_completed (boolean, default false)
- created_at, updated_at

**training_plans** — AI-generated plans stored as JSON
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- plan_data (jsonb) — contains the full PlanData structure
- version (integer, default 1)
- is_active (boolean, default true)
- created_at, updated_at
- unique(user_id, version)

**daily_logs** — Daily session tracking
- id, user_id, date (unique per user+date)
- status (planned/completed/modified/skipped)
- feeling (great/good/okay/tired/pain)
- process_goal_1, process_goal_2, notes
- custom_session_title, custom_session_duration, custom_session_focus
- created_at, updated_at

**skill_ratings** — Monthly skill self-assessment
- id, user_id, month, category, skill_name, rating (1–10)
- unique(user_id, month, category, skill_name)

**fitness_benchmarks** — Monthly fitness test results
- id, user_id, month, metric_name, value
- unique(user_id, month, metric_name)

**body_measurements** — Monthly body metrics
- Same structure as fitness_benchmarks

**matches** — Match and tournament logs
- id, user_id, date, result, opponent_level, partner
- is_tournament, tournament_name, placement
- Shot tracking: ue_net, ue_long, grip_losses, chiquitas_good/total, viboras_good/total, bajadas_good/total, points_won_net, points_won_defense, caught_standing, backpedaled
- went_well, to_improve

**journal_entries** — Monthly reflections
- id, user_id, month, prompt, response
- unique(user_id, month, prompt)

### 3.2 Row Level Security
Every table has RLS policies so users can only CRUD their own data:
```sql
alter table [table] enable row level security;
create policy "Users can read own data" on [table] for select using (auth.uid() = user_id);
create policy "Users can insert own data" on [table] for insert with check (auth.uid() = user_id);
create policy "Users can update own data" on [table] for update using (auth.uid() = user_id);
```

---

## 4. Core Flows

### 4.1 Onboarding → Plan Generation

1. User signs up (magic link email)
2. Redirected to /onboarding (5-step form)
3. Step 1: About You (name, age, height, weight, dominant hand)
4. Step 2: Your Padel (level, side, frequency, coaching, sport background)
5. Step 3: Your Facilities (multi-select: gym, pool, classes available)
6. Step 4: Your Goals (target level, challenge duration, goals text, injuries, dietary)
7. Step 5: Review & Generate (summary → "Generate My Training Plan" button)
8. API call to /api/generate-plan → Claude generates personalized PlanData
9. Plan saved to training_plans table, profile marked onboarding_completed
10. Redirect to /today

### 4.2 Plan Generation (AI)
The /api/generate-plan endpoint sends the full profile to Claude with instructions to return a PlanData JSON object containing:
- Phases (2–6 depending on challenge duration) with progressive weekly schedules
- Skill categories relevant to the player's level
- Fitness metrics appropriate for their body and limitations
- Body metrics to track
- Journal prompts personalized to their goals

The plan adapts to: available facilities, coaching frequency, classes, injuries, and level.

### 4.3 Daily Usage
- Open app → Today tab shows current day, session from their plan, and logging tools
- Log status, feeling, process goals, notes
- Contextual advice when feeling tired or in pain
- Can override scheduled session with custom session details

---

## 5. Feature Specifications

### 5.1 Today Tab
- Day counter with progress through challenge
- Current phase indicator
- Today's scheduled session (from personalized plan)
- Session status tracking (planned/completed/modified/skipped)
- Feeling check with contextual advice
- Two process goal inputs
- Session notes

### 5.2 Plan Tab
- Phase selector (browse all phases)
- Phase info: name, description, day range
- Weekly schedule for selected phase
- Phase milestones (technical + physical)
- Technical priorities for the phase

### 5.3 Skills Tab
- Month selector
- Average score across all skills for selected month
- Skill categories from the plan (not hardcoded)
- 1–10 slider rating for each skill

### 5.4 Fitness Tab
- Sub-tab: Fitness benchmarks / Body measurements
- Month selector
- Fitness metrics from the plan (not hardcoded) with "how to test" descriptions
- Body metrics from the plan (not hardcoded)
- Number input for each metric

### 5.5 Matches Tab
- Log match button → expandable form
- Match form: date, result, opponent level, shot tracking (UEs, grip losses, chiquita/vibora/bajada success rates), reflections
- Match list (newest first)
- Stat pills on each match card

### 5.6 Journal Tab
- Month selector (active months only)
- Completion tracker
- Journal prompts from the plan (not hardcoded)
- Multi-line text input per prompt

---

## 6. Key Data Types

### 6.1 PlanData (stored as JSONB in training_plans.plan_data)
```typescript
type PlanData = {
  phases: Phase[]
  skill_categories: Record<string, string[]>
  fitness_metrics: Record<string, { name: string; how: string }[]>
  body_metrics: string[]
  journal_prompts: string[]
}

type Phase = {
  number: number
  name: string
  description: string
  start_day: number
  end_day: number
  weekly_schedule: Record<string, SessionTemplate>
  technical_priorities: string[]
  milestones: { technical: string; physical: string }
}

type SessionTemplate = {
  type: "coach" | "gym" | "match" | "recovery" | "rest" | "drilling"
  title: string
  duration: string
  focus: string
  icon: string
}
```

---

## 7. PWA Configuration

### 7.1 Manifest
- name: "Padel Progress+"
- short_name: "PadelPro+"
- start_url: "/today"
- display: "standalone"
- theme_color: "#2D7D7D"
- Icons: 192x192, 512x512

### 7.2 Service Worker
Auto-generated by @ducanh2912/next-pwa. Caches static assets and app shell.

---

## 8. Auth Flow
1. User enters email on landing page
2. Supabase sends magic link
3. User clicks link → callback route exchanges code for session
4. If onboarding not completed → /onboarding
5. If onboarding completed → /today

---

## 9. Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Hobby (free) | $0 |
| Supabase | Free tier | $0 |
| Anthropic API | ~$0.02 per plan generation | ~$0.02/user |
| Domain (optional) | padelprogressplus.com | ~$1/month |
| **Total** | | **~$0–1/month at low volume** |

---

## 10. Roadmap

### V1 — MVP
- Onboarding + AI plan generation
- All 6 tabs with full CRUD
- PWA installable on mobile
- Deployed on Vercel

### V2
- Progress trend charts (skills, fitness over time)
- Streak tracking
- Shareable progress cards (Instagram stories)
- Plan regeneration (update plan mid-challenge)

### V3
- Subscription payments (Stripe or RevenueCat)
- Native app via Capacitor
- Coach view
- Community features