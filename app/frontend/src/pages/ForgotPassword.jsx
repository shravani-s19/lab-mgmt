import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({ a1: "", a2: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=email, 2=questions+reset

  const fetchQuestions = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.get(`/auth/security-questions?email=${encodeURIComponent(email)}`);
      setQuestions(data);
      setStep(2);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Account not found");
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setErr("Passwords do not match"); return; }
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        answer1: answers.a1,
        answer2: answers.a2,
        new_password: newPassword,
      });
      setMsg(data.message + " You can now sign in.");
      setStep(3);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="crce-blob crce-blob-1" style={{ top: -100, left: -100 }} />
      <div className="crce-blob crce-blob-2" style={{ bottom: -120, right: -80 }} />

      <div className="relative z-10 w-full max-w-md crce-fade-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="rounded-2xl flex items-center justify-center text-white crce-pulse-glow"
            style={{ background: "linear-gradient(135deg,#0d9488 0%,#06b6d4 100%)", width: 52, height: 52 }}>
            <GraduationCap size={26} />
          </div>
          <div>
            <div className="font-display font-black text-2xl leading-none" style={{ color: "var(--crce-text)" }}>CRCE Lab Manager</div>
            <div className="text-xs font-mono" style={{ color: "var(--crce-text-muted)" }}>Enhanced System v2</div>
          </div>
        </div>

        <div className="crce-card p-8" style={{ background: "rgba(255,255,255,0.82)" }}>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--crce-text)" }}>Forgot Password</h1>

          {step === 1 && (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--crce-text-muted)" }}>Enter your email to fetch your security questions.</p>
              <form onSubmit={fetchQuestions} className="space-y-4" autoComplete="off">
                <div>
                  <label className="crce-label">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94b5be" }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="crce-input !pl-10" placeholder="you@crce.edu.in" />
                  </div>
                </div>
                {err && <div className="text-sm rounded-xl px-4 py-2.5" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{err}</div>}
                <button type="submit" disabled={loading} className="crce-btn-primary w-full">
                  {loading ? "Checking…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {step === 2 && questions && (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--crce-text-muted)" }}>Answer your security questions to reset your password.</p>
              <form onSubmit={resetPassword} className="space-y-4" autoComplete="off">
                <div>
                  <label className="crce-label">{questions.q1}</label>
                  <input required value={answers.a1} onChange={e => setAnswers({ ...answers, a1: e.target.value })}
                    className="crce-input" placeholder="Your answer" />
                </div>
                <div>
                  <label className="crce-label">{questions.q2}</label>
                  <input required value={answers.a2} onChange={e => setAnswers({ ...answers, a2: e.target.value })}
                    className="crce-input" placeholder="Your answer" />
                </div>
                <div style={{ borderTop: "1px solid var(--crce-border-solid)", paddingTop: "1rem" }}>
                  <label className="crce-label">New Password</label>
                  <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="crce-input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="crce-label">Confirm Password</label>
                  <input type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)}
                    className="crce-input" placeholder="••••••••" />
                </div>
                {err && <div className="text-sm rounded-xl px-4 py-2.5" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{err}</div>}
                <button type="submit" disabled={loading} className="crce-btn-primary w-full">
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-sm rounded-xl px-4 py-3 mt-2"
              style={{ color: "#0d9488", background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>
              {msg}
            </div>
          )}

          <div className="mt-5 text-center text-sm" style={{ color: "var(--crce-text-muted)" }}>
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--crce-primary)" }}>
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}