import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const defaults = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function svg(size: number, props: IconProps, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={defaults.viewBox}
      fill={defaults.fill}
      stroke={defaults.stroke}
      strokeWidth={defaults.strokeWidth}
      strokeLinecap={defaults.strokeLinecap}
      strokeLinejoin={defaults.strokeLinejoin}
      className={props.className}
      style={props.style}
    >
      {children}
    </svg>
  );
}

// --- Nav icons ---

export function CalendarIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ));
}

export function ClipboardIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </>
  ));
}

export function RacketIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="11" cy="9" r="7" />
      <path d="M7 5.5L15 12.5M7.5 9.5L14.5 5M8 13l-4.5 4.5M11 2v14M4.5 6.5h13" />
    </>
  ));
}

export function DumbbellIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M6.5 6.5a2 2 0 013 0L17 14a2 2 0 01-3 0L6.5 6.5z" />
      <path d="M14 4l2-2M20 10l2-2M4 14l-2 2M10 20l-2 2M18 6l2 2M6 18l-2-2" />
    </>
  ));
}

export function TrophyIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M6 9a6 6 0 0012 0V3H6v6z" />
      <path d="M6 5H4a2 2 0 00-2 2v1a4 4 0 004 4M18 5h2a2 2 0 012 2v1a4 4 0 01-4 4" />
      <path d="M12 15v3M8 21h8M10 18h4" />
    </>
  ));
}

export function PencilIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </>
  ));
}

// --- Session type icons ---

export function GraduationCapIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M22 10l-10-5L2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      <path d="M22 10v6" />
    </>
  ));
}

export function GymIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M2 12h20" />
      <path d="M5 8v8M19 8v8" />
      <path d="M3 10v4M21 10v4" />
      <path d="M7 6v12M17 6v12" />
    </>
  ));
}

export function ShuttlecockIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="17" r="4" />
      <path d="M12 13V3M8.5 6l3.5 3 3.5-3" />
      <path d="M9 3.5l3 2.5 3-2.5" />
    </>
  ));
}

export function LotusIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M12 3c-2 4-6 7-6 11a6 6 0 0012 0c0-4-4-7-6-11z" />
      <path d="M12 8v8M9 12h6" />
    </>
  ));
}

export function SleepIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M2 4h6l-6 6h6" />
      <path d="M12 2h4l-4 4h4" />
      <path d="M3 18c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v2H3v-2z" />
    </>
  ));
}

export function TargetIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ));
}

// --- Feeling icons ---

export function FlameIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M12 2c1 4 6 6.5 6 12a6 6 0 01-12 0c0-5.5 5-8 6-12z" />
      <path d="M12 22c-1.5 0-3-1.5-3-3.5 0-2 1.5-3 3-5 1.5 2 3 3 3 5s-1.5 3.5-3 3.5z" />
    </>
  ));
}

export function SmileIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </>
  ));
}

export function NeutralIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="15" x2="16" y2="15" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </>
  ));
}

export function TiredIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </>
  ));
}

export function InjuryIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ));
}

// --- Utility icons ---

export function MailIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </>
  ));
}

export function UserIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 00-16 0" />
    </>
  ));
}

export function ChevronDownIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <path d="M6 9l6 6 6-6" />
  ));
}

export function ChevronUpIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <path d="M18 15l-6-6-6 6" />
  ));
}

export function CheckIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <path d="M20 6L9 17l-5-5" />
  ));
}

export function ChevronLeftIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <path d="M15 18l-6-6 6-6" />
  ));
}

export function ChevronRightIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <path d="M9 18l6-6-6-6" />
  ));
}

export function MedalIcon({ size = 24, ...props }: IconProps) {
  return svg(size, props, (
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 2h6l-1.5 5h-3L9 2z" />
      <path d="M9 7l-3-5M15 7l3-5" />
    </>
  ));
}

// --- Icon map & dynamic rendering ---

export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  "calendar": CalendarIcon,
  "clipboard": ClipboardIcon,
  "racket": RacketIcon,
  "dumbbell": DumbbellIcon,
  "trophy": TrophyIcon,
  "pencil": PencilIcon,
  "graduation-cap": GraduationCapIcon,
  "gym": GymIcon,
  "shuttlecock": ShuttlecockIcon,
  "lotus": LotusIcon,
  "sleep": SleepIcon,
  "target": TargetIcon,
  "flame": FlameIcon,
  "smile": SmileIcon,
  "neutral": NeutralIcon,
  "tired": TiredIcon,
  "injury": InjuryIcon,
  "mail": MailIcon,
  "user": UserIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  "check": CheckIcon,
  "medal": MedalIcon,
};

const EMOJI_TO_ICON: Record<string, string> = {
  "🎯": "target",
  "🏋️": "gym",
  "🏆": "trophy",
  "🧘": "lotus",
  "🌊": "sleep",
  "🎾": "shuttlecock",
  "📅": "calendar",
  "📋": "clipboard",
  "💪": "dumbbell",
  "📝": "pencil",
  "🔥": "flame",
  "👍": "smile",
  "😐": "neutral",
  "😩": "tired",
  "🤕": "injury",
  "📩": "mail",
};

export function resolveIconName(value: string): string {
  if (ICON_MAP[value]) return value;
  return EMOJI_TO_ICON[value] ?? "target";
}

export function Icon({ name, size = 24, ...props }: IconProps & { name: string }) {
  const resolved = resolveIconName(name);
  const Component = ICON_MAP[resolved];
  if (!Component) return null;
  return <Component size={size} {...props} />;
}
