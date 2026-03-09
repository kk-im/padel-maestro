export const SESSION_TYPES = [
  "coach",
  "gym",
  "match",
  "recovery",
  "rest",
  "drilling",
] as const;

export const SESSION_STATUSES = [
  "planned",
  "completed",
  "modified",
  "skipped",
] as const;

export const FEELINGS = [
  { icon: "flame", label: "Great", value: "great" },
  { icon: "smile", label: "Good", value: "good" },
  { icon: "neutral", label: "Okay", value: "okay" },
  { icon: "tired", label: "Tired", value: "tired" },
  { icon: "injury", label: "Pain", value: "pain" },
] as const;

export const PLAYING_LEVELS = [
  "Complete beginner",
  "Beginner (0-6 months)",
  "Low bronze",
  "High bronze",
  "Low silver",
  "High silver",
  "Low gold",
  "High gold",
  "Advanced",
] as const;

export const TARGET_LEVELS = PLAYING_LEVELS;

export const PLAYING_FREQUENCIES = [
  "1-2 times per week",
  "3-4 times per week",
  "5-6 times per week",
  "Daily",
] as const;

export const COACHING_FREQUENCIES = [
  "None",
  "1x per week",
  "2x per week",
  "3+ per week",
] as const;

export const FACILITY_OPTIONS = [
  "Gym",
  "Swimming pool",
  "Pilates studio",
  "Cold plunge",
  "Sauna",
  "Yoga studio",
  "Boxing gym",
  "CrossFit/Hyrox gym",
  "Tennis court",
  "Padel court (for solo drilling)",
] as const;

export const CLASS_OPTIONS = [
  "Hyrox",
  "Boxing",
  "CrossFit",
  "Yoga",
  "Pilates",
  "Spinning",
  "Swimming",
  "Dance",
  "Martial arts",
] as const;

export const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "No fish/seafood",
  "No pork",
  "No beef",
  "No dairy",
  "No gluten",
  "No soy",
  "No nuts",
  "Halal",
  "Kosher",
] as const;

export const DOMINANT_HANDS = ["Right", "Left"] as const;

export const PREFERRED_SIDES = [
  "Right side",
  "Left side",
  "Both / no preference",
] as const;

export const SESSION_TYPE_ICONS: Record<string, string> = {
  coach: "graduation-cap",
  gym: "gym",
  match: "trophy",
  recovery: "lotus",
  rest: "sleep",
  drilling: "shuttlecock",
};

export const SESSION_DURATIONS = [
  "30 min",
  "1 hr",
  "1.5 hrs",
  "2 hrs",
  "2.5 hrs",
  "3 hrs",
] as const;

export const SESSION_FOCUSES = [
  "Serve",
  "Volley",
  "Bandeja",
  "Vibora",
  "Defense",
  "Footwork",
  "Match play",
  "Positioning",
] as const;

export const CHALLENGE_DURATIONS = [
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "12 months", days: 365 },
] as const;
