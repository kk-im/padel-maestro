"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DOMINANT_HANDS,
  PLAYING_LEVELS,
  PREFERRED_SIDES,
  PLAYING_FREQUENCIES,
  COACHING_FREQUENCIES,
  FACILITY_OPTIONS,
  CLASS_OPTIONS,
  TARGET_LEVELS,
  CHALLENGE_DURATIONS,
  DIETARY_RESTRICTIONS,
} from "@/lib/data/constants";

const STEP_TITLES = [
  "About You",
  "Your Padel",
  "Your Facilities",
  "Your Goals",
  "Review & Generate",
];

interface FormData {
  name: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  dominant_hand: string;
  playing_level: string;
  preferred_side: string;
  playing_frequency: string;
  coaching_frequency: string;
  racket_sport_background: string;
  other_sport_background: string;
  available_facilities: string[];
  available_classes: string[];
  target_level: string;
  challenge_duration_days: number;
  goals: string;
  injuries_or_limitations: string;
  dietary_restrictions: string[];
}

const initialFormData: FormData = {
  name: "",
  age: "",
  height_cm: "",
  weight_kg: "",
  dominant_hand: "Right",
  playing_level: "",
  preferred_side: "Both / no preference",
  playing_frequency: "",
  coaching_frequency: "",
  racket_sport_background: "",
  other_sport_background: "",
  available_facilities: [],
  available_classes: [],
  target_level: "",
  challenge_duration_days: 180,
  goals: "",
  injuries_or_limitations: "",
  dietary_restrictions: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const set = (field: keyof FormData, value: FormData[keyof FormData]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleArray = (field: "available_facilities" | "available_classes" | "dietary_restrictions", value: string) => {
    setForm((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!(form.name && form.age && form.height_cm && form.weight_kg);
      case 1:
        return !!(form.playing_level && form.playing_frequency && form.coaching_frequency);
      case 2:
        return true;
      case 3:
        return !!(form.target_level && form.challenge_duration_days);
      default:
        return true;
    }
  };

  const next = () => {
    if (!canAdvance()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please log in again.");
        setGenerating(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Upsert profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        name: form.name,
        age: parseInt(form.age),
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        dominant_hand: form.dominant_hand,
        playing_level: form.playing_level,
        preferred_side: form.preferred_side,
        playing_frequency: form.playing_frequency,
        coaching_frequency: form.coaching_frequency,
        racket_sport_background: form.racket_sport_background || null,
        other_sport_background: form.other_sport_background || null,
        available_facilities: form.available_facilities,
        available_classes: form.available_classes,
        target_level: form.target_level,
        challenge_duration_days: form.challenge_duration_days,
        start_date: today,
        goals: form.goals || null,
        injuries_or_limitations: form.injuries_or_limitations || null,
        dietary_restrictions: form.dietary_restrictions,
        onboarding_completed: false,
      });

      if (profileError) {
        setError("Failed to save profile: " + profileError.message);
        setGenerating(false);
        return;
      }

      // Generate plan
      const res = await fetch("/api/generate-plan", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to generate plan.");
        setGenerating(false);
        return;
      }

      // Mark onboarding completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      router.push("/today");
    } catch {
      setError("Something went wrong. Please try again.");
      setGenerating(false);
    }
  };

  // --- Shared styles ---
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "#fff",
    border: "1px solid rgba(0,0,0,0.06)",
    fontSize: "15px",
    color: "var(--text-primary)",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%235E5C58' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  };

  // --- Render helpers ---
  const renderInput = (
    label: string,
    field: keyof FormData,
    type: "text" | "number" = "text",
    placeholder?: string,
    required?: boolean
  ) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--bg-card-peach)" }}> *</span>}
      </label>
      <input
        type={type}
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );

  const renderSelect = (
    label: string,
    field: keyof FormData,
    options: readonly string[],
    required?: boolean
  ) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--bg-card-peach)" }}> *</span>}
      </label>
      <select
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        style={selectStyle}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  const renderCheckboxGroup = (
    label: string,
    field: "available_facilities" | "available_classes" | "dietary_restrictions",
    options: readonly string[]
  ) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ ...labelStyle, marginBottom: "12px" }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const selected = (form[field] as string[]).includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleArray(field, opt)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-pill)",
                fontSize: "14px",
                fontWeight: 500,
                border: selected ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                backgroundColor: selected ? "var(--text-primary)" : "#fff",
                color: selected ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSummaryRow = (label: string, value: string | undefined | null) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontSize: "14px",
      }}
    >
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
        {value || "—"}
      </span>
    </div>
  );

  // --- Step content ---
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            {renderInput("Name", "name", "text", "Your name", true)}
            {renderInput("Age", "age", "number", "25", true)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {renderInput("Height (cm)", "height_cm", "number", "175", true)}
              {renderInput("Weight (kg)", "weight_kg", "number", "75", true)}
            </div>
            {renderSelect("Dominant hand", "dominant_hand", DOMINANT_HANDS)}
          </>
        );
      case 1:
        return (
          <>
            {renderSelect("Current playing level", "playing_level", PLAYING_LEVELS, true)}
            {renderSelect("Preferred court side", "preferred_side", PREFERRED_SIDES)}
            {renderSelect("How often do you play?", "playing_frequency", PLAYING_FREQUENCIES, true)}
            {renderSelect("How often do you have coaching?", "coaching_frequency", COACHING_FREQUENCIES, true)}
            {renderInput("Any racket sport background?", "racket_sport_background", "text", "e.g. Tennis 5 years, None")}
            {renderInput("Any other sport background?", "other_sport_background", "text", "e.g. Dance, Football, Swimming")}
          </>
        );
      case 2:
        return (
          <>
            {renderCheckboxGroup("What facilities do you have access to?", "available_facilities", FACILITY_OPTIONS)}
            {renderCheckboxGroup("What classes are available to you?", "available_classes", CLASS_OPTIONS)}
          </>
        );
      case 3:
        return (
          <>
            {renderSelect("What's your target level?", "target_level", TARGET_LEVELS, true)}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>
                How long is your training challenge?
                <span style={{ color: "var(--bg-card-peach)" }}> *</span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {CHALLENGE_DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => set("challenge_duration_days", d.days)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 600,
                      border:
                        form.challenge_duration_days === d.days
                          ? "2px solid var(--text-primary)"
                          : "1px solid rgba(0,0,0,0.1)",
                      backgroundColor:
                        form.challenge_duration_days === d.days
                          ? "var(--text-primary)"
                          : "#fff",
                      color:
                        form.challenge_duration_days === d.days
                          ? "#fff"
                          : "var(--text-primary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>What are your main goals?</label>
              <textarea
                value={form.goals}
                onChange={(e) => set("goals", e.target.value)}
                placeholder="e.g. Reach gold level, play tournaments, improve my volleys..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            {renderInput("Any injuries or physical limitations?", "injuries_or_limitations", "text", "e.g. Knee surgery 2023, None")}
            {renderCheckboxGroup("Any dietary restrictions?", "dietary_restrictions", DIETARY_RESTRICTIONS)}
          </>
        );
      case 4:
        return (
          <div>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>About You</p>
              {renderSummaryRow("Name", form.name)}
              {renderSummaryRow("Age", form.age)}
              {renderSummaryRow("Height", form.height_cm ? `${form.height_cm} cm` : null)}
              {renderSummaryRow("Weight", form.weight_kg ? `${form.weight_kg} kg` : null)}
              {renderSummaryRow("Dominant hand", form.dominant_hand)}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>Your Padel</p>
              {renderSummaryRow("Current level", form.playing_level)}
              {renderSummaryRow("Preferred side", form.preferred_side)}
              {renderSummaryRow("Playing frequency", form.playing_frequency)}
              {renderSummaryRow("Coaching frequency", form.coaching_frequency)}
              {renderSummaryRow("Racket sport background", form.racket_sport_background)}
              {renderSummaryRow("Other sports", form.other_sport_background)}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>Facilities & Classes</p>
              {renderSummaryRow("Facilities", form.available_facilities.join(", ") || "None selected")}
              {renderSummaryRow("Classes", form.available_classes.join(", ") || "None selected")}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>Your Goals</p>
              {renderSummaryRow("Target level", form.target_level)}
              {renderSummaryRow(
                "Challenge duration",
                CHALLENGE_DURATIONS.find((d) => d.days === form.challenge_duration_days)?.label
              )}
              {renderSummaryRow("Goals", form.goals)}
              {renderSummaryRow("Injuries/limitations", form.injuries_or_limitations)}
              {renderSummaryRow("Dietary restrictions", form.dietary_restrictions.join(", ") || "None")}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Step {step + 1} of 5
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
              {STEP_TITLES[step]}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: "rgba(0,0,0,0.06)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((step + 1) / 5) * 100}%`,
                height: "100%",
                backgroundColor: "var(--text-primary)",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Step title */}
        <h1
          className="font-[family-name:var(--font-outfit)]"
          style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}
        >
          {STEP_TITLES[step]}
        </h1>

        {/* Step content */}
        <div
          className="glass-panel"
          style={{ padding: "24px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}
        >
          {renderStep()}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(255, 100, 100, 0.1)",
              border: "1px solid rgba(255, 100, 100, 0.2)",
              fontSize: "14px",
              color: "#c0392b",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "12px" }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#fff",
                color: "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 600,
                border: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={next}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--text-primary)",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                cursor: canAdvance() ? "pointer" : "not-allowed",
                opacity: canAdvance() ? 1 : 0.5,
                transition: "all 0.15s ease",
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: generating ? "var(--text-secondary)" : "var(--bg-card-peach)",
                color: generating ? "#fff" : "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 700,
                border: "none",
                cursor: generating ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {generating ? "Generating your plan..." : "Generate My Training Plan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
