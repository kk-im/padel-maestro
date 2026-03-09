"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  ClipboardIcon,
  RacketIcon,
  DumbbellIcon,
  TrophyIcon,
  PencilIcon,
  UserIcon,
} from "@/components/ui/Icons";

const TABS = [
  { href: "/today", label: "Today", Icon: CalendarIcon },
  { href: "/plan", label: "Plan", Icon: ClipboardIcon },
  { href: "/skills", label: "Skills", Icon: RacketIcon },
  { href: "/fitness", label: "Fitness", Icon: DumbbellIcon },
  { href: "/matches", label: "Matches", Icon: TrophyIcon },
  { href: "/journal", label: "Journal", Icon: PencilIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--bg-glass-border)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "56px",
                minWidth: "38px",
                padding: "6px 2px 8px",
                textDecoration: "none",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "color 0.15s ease",
              }}
            >
              <tab.Icon size={20} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? 600 : 500,
                  marginTop: "2px",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
              </span>
              {active && (
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--text-primary)",
                    marginTop: "2px",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
