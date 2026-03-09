"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MailIcon } from "@/components/ui/Icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background texture */}
      <div className="pattern-dots absolute inset-0 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Hero card */}
        <div
          className="relative overflow-hidden p-8 mb-6"
          style={{
            backgroundColor: "var(--bg-card-yellow)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Decorative shapes */}
          <div
            className="absolute bottom-0 left-0 w-[120px] h-[80px]"
            style={{
              backgroundColor: "var(--text-primary)",
              borderTopRightRadius: "80px",
            }}
          />
          <div className="pattern-dots absolute bottom-5 left-[130px] w-[80px] h-[60px]" />
          <div className="pattern-hatch absolute top-1/2 right-8 -translate-y-1/2 w-[80px] h-[80px] rounded-full" />

          <div className="relative z-10">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6"
              style={{
                background: "rgba(255,255,255,0.4)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <h1
              className="font-[family-name:var(--font-outfit)]"
              style={{ fontSize: "42px", lineHeight: 1, marginBottom: "4px" }}
            >
              Padel
            </h1>
            <h2
              className="font-[family-name:var(--font-outfit)]"
              style={{ fontSize: "42px", lineHeight: 1, fontWeight: 300, opacity: 0.6 }}
            >
              Maestro
            </h2>

            <p
              className="mt-4"
              style={{
                fontSize: "13px",
                color: "#6d702d",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Your AI-powered padel training companion
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="glass-panel p-8"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          {sent ? (
            <div className="text-center space-y-3">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2"
                style={{ backgroundColor: "var(--bg-card-yellow)" }}
              >
                <MailIcon size={20} />
              </div>
              <p style={{ fontSize: "18px", fontWeight: 500 }}>
                Check your email!
              </p>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
                We sent a magic link to{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{email}</span>
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-4 cursor-pointer"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full outline-none transition-all"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "#fff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "15px",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--text-primary)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>

              {error && (
                <div
                  className="text-center"
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(255, 100, 100, 0.1)",
                    border: "1px solid rgba(255, 100, 100, 0.2)",
                    fontSize: "14px",
                    color: "#c0392b",
                  }}
                >
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer pills */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div
            style={{
              height: "8px",
              width: "40px",
              backgroundColor: "var(--text-primary)",
              borderRadius: "100px",
            }}
          />
          <div
            style={{
              height: "8px",
              width: "8px",
              backgroundColor: "var(--text-primary)",
              borderRadius: "100px",
              opacity: 0.3,
            }}
          />
          <div
            style={{
              height: "8px",
              width: "8px",
              backgroundColor: "var(--text-primary)",
              borderRadius: "100px",
              opacity: 0.3,
            }}
          />
        </div>
      </div>
    </div>
  );
}
