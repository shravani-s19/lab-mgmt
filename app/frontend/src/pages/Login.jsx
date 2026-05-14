import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Lock, Mail, LogOut, User } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@crce.edu");
  const [password, setPassword] = useState("Admin@123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user: savedUser, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const hasSession = savedUser !== null;

  const handleClearSession = () => {
    logout();
    window.location.reload();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(email, password);
      const dest = loc.state?.from || (u.role === "ADMIN" ? "/admin" : u.role === "ASSISTANT" ? "/assistant" : "/student");
      navigate(dest, { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="crce-blob crce-blob-1" style={{ top: -100, left: -100 }} />
      <div className="crce-blob crce-blob-2" style={{ bottom: -120, right: -80 }} />
      <div className="crce-blob crce-blob-3" style={{ top: "40%", left: "55%" }} />

      {/* Session banner */}
      {hasSession && (
        <div className="absolute top-0 left-0 right-0 z-50 py-3 px-4"
          style={{ background: "rgba(13,148,136,0.12)", borderBottom: "1px solid rgba(13,148,136,0.2)", backdropFilter: "blur(10px)" }}>
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--crce-primary)" }}>
              <User size={15} />
              <span>Logged in as <strong>{savedUser.name}</strong> ({savedUser.role})</span>
            </div>
            <button onClick={handleClearSession}
              className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--crce-primary)" }}>
              <LogOut size={13} /> Clear Session
            </button>
          </div>
        </div>
      )}

      <div className={`relative z-10 w-full max-w-md crce-fade-up ${hasSession ? "pt-14" : ""}`}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-13 w-13 rounded-2xl flex items-center justify-center text-white crce-pulse-glow"
            style={{ background: "linear-gradient(135deg,#0d9488 0%,#06b6d4 100%)", width: 52, height: 52 }}>
            <GraduationCap size={26} />
          </div>
          <div>
            <div className="font-display font-black text-2xl leading-none" style={{ color: "var(--crce-text)" }}>
              CRCE Lab Manager
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--crce-text-muted)" }}>Enhanced System v2</div>
          </div>
        </div>

        {/* Card */}
        <div className="crce-card p-8" style={{ background: "rgba(255,255,255,0.82)" }}>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--crce-text)" }}>Sign in</h1>
          <p className="text-sm mb-6" style={{ color: "var(--crce-text-muted)" }}>Welcome back. Enter your credentials below.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="crce-label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94b5be" }} />
                <input
                  data-testid="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="crce-input !pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="crce-label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94b5be" }} />
                <input
                  data-testid="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="crce-input !pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {err && (
              <div data-testid="login-error"
                className="text-sm rounded-xl px-4 py-2.5"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {err}
              </div>
            )}

            <button data-testid="login-submit" type="submit" disabled={loading} className="crce-btn-primary w-full mt-1">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: "var(--crce-text-muted)" }}>
            New student?{" "}
            <Link data-testid="signup-link" to="/signup"
              className="font-semibold hover:underline" style={{ color: "var(--crce-primary)" }}>
              Create an account
            </Link>
          </div>

          {/* Test accounts */}
          <div className="mt-6 pt-5 text-xs space-y-1" style={{ borderTop: "1px solid var(--crce-border-solid)", color: "var(--crce-text-muted)" }}>
            <div className="font-bold uppercase tracking-wider text-[10px] mb-2" style={{ color: "var(--crce-primary)" }}>Test accounts</div>
            <div>admin@crce.edu / Admin@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}