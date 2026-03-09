import type { Profile, PlanData, Phase, SessionTemplate } from "@/types";

const PHASE_NAMES = [
  { name: "Build the Foundation", desc: "Establish core technique, body position, and physical baseline." },
  { name: "Develop Your Weapons", desc: "Add offensive shots, improve transitions, and build match fitness." },
  { name: "Sharpen the Game", desc: "Refine shot selection, develop patterns, and compete consistently." },
  { name: "Play the Chess Match", desc: "Master tactical play, read opponents, and peak for competition." },
];

const PHASE_PRIORITIES = [
  ["Body position (staying low)", "Basic volley technique", "Grip security", "Overhead footwork", "Court movement basics"],
  ["Chiquita development", "Vibora technique", "Bajada progression", "Flat defense under pressure", "Transition play"],
  ["Pattern play", "Shot selection", "Point construction", "Match composure", "Partner communication"],
  ["Tactical mastery", "Reading opponents", "Advanced shot combinations", "Mental resilience", "Competition strategy"],
];

const PHASE_MILESTONES = [
  { technical: "Consistent volleys and reliable overhead positioning", physical: "Complete baseline fitness benchmarks" },
  { technical: "Land chiquitas and viboras with direction in drills", physical: "Grip strength up 15%, lateral agility improved" },
  { technical: "Win points with constructed patterns in matches", physical: "Cardio and recovery at target levels" },
  { technical: "Adapt tactics mid-match and dominate at target level", physical: "Peak physical condition maintained" },
];

const SKILL_CATEGORIES: Record<string, string[]> = {
  "Net Play": ["Forehand volley", "Backhand volley", "Volley direction control", "Bajada", "Vibora", "Smash/overhead"],
  "Defense & Transition": ["Chiquita (open)", "Cage chiquita", "Flat defense", "Lob quality", "Defense under pressure"],
  "Movement": ["Body position (staying low)", "Overhead footwork", "Split step consistency", "Court positioning", "Ball direction control", "Grip security"],
  "Tactical & Mental": ["Shot selection", "Point construction", "Partner communication", "Mental resilience", "Match composure"],
};

const BODY_METRICS = [
  "Weight (kg)", "Waist (cm)", "Hips (cm)",
  "R thigh (cm)", "L thigh (cm)",
  "R forearm (cm)", "L forearm (cm)",
  "R upper arm (cm)", "L upper arm (cm)",
];

const JOURNAL_PROMPTS = [
  "How does my body feel on court?",
  "What shot improved most this month?",
  "What am I still struggling with?",
  "Am I thinking less and reacting more?",
  "Biggest win this month (any kind)?",
  "What would I tell last-month-me?",
  "Am I enjoying the process?",
  "Focus for next month?",
];

function buildFitnessMetrics(profile: Profile) {
  const injuries = (profile.injuries_or_limitations ?? "").toLowerCase();
  const hasKneeIssue = /knee/i.test(injuries);
  const hasShoulderIssue = /shoulder/i.test(injuries);
  const hasBackIssue = /back|spine/i.test(injuries);

  const grip: { name: string; how: string }[] = [
    { name: "Grip strength R (kg)", how: "Dynamometer, best of 3" },
    { name: "Grip strength L (kg)", how: "Dynamometer, best of 3" },
    { name: "Dead hang (sec)", how: "Overhand, hang until failure" },
    { name: "Farmer's walk (kg x m)", how: "Weight times distance" },
  ];

  const lower: { name: string; how: string }[] = [];
  if (!hasKneeIssue) {
    lower.push({ name: "Goblet squat max (kg)", how: "Deep squat, good form" });
  }
  lower.push({ name: "Wall sit (sec)", how: "Thighs parallel, time to fail" });
  if (!hasKneeIssue) {
    lower.push({ name: "Vertical jump (cm)", how: "Standing jump, measure" });
  }
  lower.push({ name: "Lateral shuffle 10x (sec)", how: "Side to side, touch lines" });

  const core: { name: string; how: string }[] = [];
  if (!hasBackIssue) {
    core.push({ name: "Plank hold (sec)", how: "Forearm plank, good form" });
  }
  if (profile.available_facilities?.includes("Swimming pool")) {
    core.push({ name: "50m swim sprint (sec)", how: "Freestyle, from push-off" });
  }
  core.push({ name: "Resting HR (bpm)", how: "Morning, before rising" });

  if (hasShoulderIssue) {
    const deadHangIdx = grip.findIndex((m) => m.name === "Dead hang (sec)");
    if (deadHangIdx !== -1) grip.splice(deadHangIdx, 1);
  }

  const metrics: Record<string, { name: string; how: string }[]> = {
    "Grip & Upper Body": grip,
    "Lower Body": lower,
    "Core & Cardio": core,
  };

  return metrics;
}

function buildWeeklySchedule(
  profile: Profile,
  phaseNumber: number
): Record<string, SessionTemplate> {
  const coaching = profile.coaching_frequency ?? "None";
  const facilities = profile.available_facilities ?? [];
  const classes = profile.available_classes ?? [];
  const hasGym = facilities.includes("Gym") || facilities.includes("CrossFit/Hyrox gym");
  const hasPool = facilities.includes("Swimming pool");
  const hasPilates = facilities.includes("Pilates studio");

  const schedule: Record<string, SessionTemplate> = {};

  // Monday
  if (coaching === "1x per week" || coaching === "2x per week" || coaching === "3+ per week") {
    const focusMap = [
      "Body position + volley mechanics",
      "Chiquita technique + vibora correction",
      "Pattern play + tactical drilling",
      "Advanced combinations + reading opponents",
    ];
    schedule.Mon = {
      type: "coach",
      title: "Coach Session #1",
      duration: "90 min",
      focus: focusMap[Math.min(phaseNumber - 1, 3)],
      icon: "graduation-cap",
    };
  } else {
    schedule.Mon = {
      type: "drilling",
      title: "Solo Drilling",
      duration: "60 min",
      focus: "Wall drills + footwork patterns",
      icon: "shuttlecock",
    };
  }

  // Tuesday
  if (classes.includes("Hyrox")) {
    schedule.Tue = {
      type: "gym",
      title: "Hyrox Class",
      duration: "60 min",
      focus: "Padel-specific power + endurance",
      icon: "gym",
    };
  } else if (hasGym) {
    schedule.Tue = {
      type: "gym",
      title: "Gym (Strength A)",
      duration: "60–75 min",
      focus: "Full-body power + grip training",
      icon: "gym",
    };
  } else {
    schedule.Tue = {
      type: "drilling",
      title: "Drilling + Fitness",
      duration: "60 min",
      focus: "Bodyweight circuits + wall drills",
      icon: "shuttlecock",
    };
  }

  // Wednesday
  if (coaching === "2x per week" || coaching === "3+ per week") {
    const focusMap = [
      "Overhead footwork + pressure drilling",
      "Bajada progression + defense patterns",
      "Tactical correction + match scenarios",
      "Competition simulation + analysis",
    ];
    schedule.Wed = {
      type: "coach",
      title: "Coach Session #2",
      duration: "90 min",
      focus: focusMap[Math.min(phaseNumber - 1, 3)],
      icon: "graduation-cap",
    };
  } else {
    schedule.Wed = {
      type: "match",
      title: "Match Play",
      duration: "90 min",
      focus: "Apply skills in live play",
      icon: "trophy",
    };
  }

  // Thursday
  if (classes.includes("Boxing")) {
    schedule.Thu = {
      type: "recovery",
      title: "Boxing + Recovery",
      duration: "60 min",
      focus: "Conditioning + active recovery",
      icon: "lotus",
    };
  } else if (hasPilates) {
    schedule.Thu = {
      type: "recovery",
      title: "Pilates + Mobility",
      duration: "60 min",
      focus: "Core stability + flexibility",
      icon: "lotus",
    };
  } else if (hasPool) {
    schedule.Thu = {
      type: "recovery",
      title: "Swimming + Mobility",
      duration: "45–60 min",
      focus: "Low-impact cardio + recovery",
      icon: "lotus",
    };
  } else {
    schedule.Thu = {
      type: "recovery",
      title: "Active Recovery",
      duration: "30–45 min",
      focus: "Stretching + foam rolling",
      icon: "lotus",
    };
  }

  // Friday
  if (coaching === "3+ per week") {
    const focusMap = [
      "Match preparation + game plans",
      "Shot combination drills + pressure play",
      "Pre-tournament tactical sessions",
      "Peak performance coaching + mental prep",
    ];
    schedule.Fri = {
      type: "coach",
      title: "Coach Session #3",
      duration: "90 min",
      focus: focusMap[Math.min(phaseNumber - 1, 3)],
      icon: "graduation-cap",
    };
  } else {
    schedule.Fri = {
      type: "match",
      title: "Competitive Match Play",
      duration: "90 min",
      focus: "Apply drills in live play",
      icon: "trophy",
    };
  }

  // Saturday
  if (hasGym) {
    schedule.Sat = {
      type: "gym",
      title: "Gym (Strength B) + Drilling",
      duration: "60 min + 60 min",
      focus: "Upper body/grip + solo ball sets",
      icon: "gym",
    };
  } else {
    schedule.Sat = {
      type: "match",
      title: "Match Play / Tournament",
      duration: "90–120 min",
      focus: "Competition application",
      icon: "trophy",
    };
  }

  // Sunday
  schedule.Sun = {
    type: "rest",
    title: "Active Recovery / Light Play",
    duration: "60–90 min",
    focus: hasPool ? "Fun play, swim, or rest" : "Light play, walk, or rest",
    icon: "sleep",
  };

  return schedule;
}

export function generateDefaultPlan(profile: Profile): PlanData {
  const totalDays = profile.challenge_duration_days;
  let numPhases: number;
  if (totalDays <= 90) numPhases = 2;
  else if (totalDays <= 180) numPhases = 3;
  else numPhases = 4;

  const daysPerPhase = Math.floor(totalDays / numPhases);

  const phases: Phase[] = [];
  for (let i = 0; i < numPhases; i++) {
    const startDay = i * daysPerPhase + 1;
    const endDay = i === numPhases - 1 ? totalDays : (i + 1) * daysPerPhase;

    phases.push({
      number: i + 1,
      name: PHASE_NAMES[Math.min(i, PHASE_NAMES.length - 1)].name,
      description: PHASE_NAMES[Math.min(i, PHASE_NAMES.length - 1)].desc,
      start_day: startDay,
      end_day: endDay,
      weekly_schedule: buildWeeklySchedule(profile, i + 1),
      technical_priorities: PHASE_PRIORITIES[Math.min(i, PHASE_PRIORITIES.length - 1)],
      milestones: PHASE_MILESTONES[Math.min(i, PHASE_MILESTONES.length - 1)],
    });
  }

  return {
    phases,
    skill_categories: SKILL_CATEGORIES,
    fitness_metrics: buildFitnessMetrics(profile),
    body_metrics: BODY_METRICS,
    journal_prompts: JOURNAL_PROMPTS,
  };
}
