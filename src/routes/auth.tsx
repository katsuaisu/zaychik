import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GizmoLogo } from "@/components/GizmoLogo";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Zaychik" },
      {
        name: "description",
        content:
          "Sign in or create a Zaychik account to track your GWA and study your flashcard decks.",
      },
      { property: "og:title", content: "Sign in — Zaychik" },
      {
        property: "og:description",
        content: "Sign in to track your GWA and study your flashcard decks.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/decks", replace: true });
  }, [loading, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || email.split("@")[0] },
          },
        });
        if (err) throw err;
        const { data } = await supabase.auth.getSession();
        if (!data.session) setNotice("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/decks", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-2 w-full shrink-0 edge-gradient" />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="card-soft w-full max-w-md p-7">
          <div className="flex flex-col items-center gap-2">
            <GizmoLogo />
            <p className="text-center text-sm text-muted-foreground">
              GWA calculator + flashcards for senior high.
            </p>
          </div>

          <div className="mt-6 flex rounded-full bg-muted p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`min-h-11 flex-1 rounded-full text-sm font-bold press ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            {mode === "signup" && (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="min-h-12 rounded-2xl border border-border bg-background px-4 text-[15px] outline-none focus:border-brand"
              />
            )}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="min-h-12 rounded-2xl border border-border bg-background px-4 text-[15px] outline-none focus:border-brand"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="min-h-12 rounded-2xl border border-border bg-background px-4 text-[15px] outline-none focus:border-brand"
            />

            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            {notice && <p className="text-sm font-semibold text-band-excellent">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="min-h-12 rounded-full bg-brand text-[15px] font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={google}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-bold press hover:bg-muted/60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24z"
              />
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
              <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-semibold text-foreground hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
      <div className="h-2 w-full shrink-0 edge-gradient" />
    </div>
  );
}
