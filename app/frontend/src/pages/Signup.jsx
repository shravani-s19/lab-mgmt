import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function Signup() {
  const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your primary school?",
  "What is your oldest sibling's name?",
  "What city were you born in?",
  "What is your favourite teacher's name?",
];

const [form, setForm] = useState({
    name: "", email: "", password: "", roll_no: "", department: "Computer Engineering", year: "TE",
    security_q1: SECURITY_QUESTIONS[0], security_a1: "",
    security_q2: SECURITY_QUESTIONS[1], security_a2: "",
  });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const nav = useNavigate();

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try { await signup(form); nav("/student", { replace: true }); }
    catch (e) {
  const detail = e?.response?.data?.detail || "Signup failed";
  setErr(detail.includes("UNIQUE") ? "An account with this email already exists." : detail);
}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background blobs */}
      <div className="crce-blob crce-blob-1" style={{ top: -80, right: -80, animationDelay: "-1s" }} />
      <div className="crce-blob crce-blob-2" style={{ bottom: -100, left: -60 }} />

      <div className="relative z-10 w-full max-w-lg crce-fade-up">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 text-sm mb-4 w-fit hover:opacity-70 transition-opacity" style={{ color: "var(--crce-primary)" }}>
          <ArrowLeft size={15} /> Back to Home
        </Link>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="rounded-2xl flex items-center justify-center text-white"
            style={{ width: 46, height: 46, background: "linear-gradient(135deg,#0d9488 0%,#06b6d4 100%)", boxShadow: "0 4px 18px rgba(13,148,136,0.4)" }}>
            <GraduationCap size={22} />
          </div>
          <div className="font-display font-black text-xl" style={{ color: "var(--crce-text)" }}>Student Signup</div>
        </div>

        {/* Card */}
        <div className="crce-card p-8" style={{ background: "rgba(255,255,255,0.82)" }}>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--crce-text)" }}>Create your account</h1>
          <p className="text-sm mb-6" style={{ color: "var(--crce-text-muted)" }}>
            Auto-approved access for browsing labs and requesting equipment.
          </p>

          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" autoComplete="off">
            <div className="sm:col-span-2">
              <label className="crce-label">Full Name</label>
              <input data-testid="signup-name" required value={form.name} onChange={onChange("name")} className="crce-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="crce-label">Email</label>
              <input data-testid="signup-email" type="email" required value={form.email} onChange={onChange("email")} className="crce-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="crce-label">Password</label>
              <input data-testid="signup-password" type="password" minLength={6} required value={form.password} onChange={onChange("password")} className="crce-input" />
            </div>
            <div>
              <label className="crce-label">Roll No</label>
              <input data-testid="signup-roll" required value={form.roll_no} onChange={onChange("roll_no")} className="crce-input" />
            </div>
            <div>
              <label className="crce-label">Year</label>
              <select data-testid="signup-year" value={form.year} onChange={onChange("year")} className="crce-input">
                <option>FE</option><option>SE</option><option>TE</option><option>BE</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="crce-label">Department</label>
              <input data-testid="signup-department" required value={form.department} onChange={onChange("department")} className="crce-input" />
            </div>

            <div className="sm:col-span-2 pt-2" style={{ borderTop: "1px solid var(--crce-border-solid)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--crce-primary)" }}>
                Security Questions — used to recover your password
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="crce-label">Security Question 1</label>
              <select value={form.security_q1} onChange={onChange("security_q1")} className="crce-input">
                {SECURITY_QUESTIONS.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="crce-label">Answer 1</label>
              <input required value={form.security_a1} onChange={onChange("security_a1")} className="crce-input" placeholder="Your answer" />
            </div>

            <div className="sm:col-span-2">
              <label className="crce-label">Security Question 2</label>
              <select value={form.security_q2} onChange={onChange("security_q2")} className="crce-input">
                {SECURITY_QUESTIONS.filter(q => q !== form.security_q1).map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="crce-label">Answer 2</label>
              <input required value={form.security_a2} onChange={onChange("security_a2")} className="crce-input" placeholder="Your answer" />
            </div>

            {err && (
              <div data-testid="signup-error"
                className="sm:col-span-2 text-sm rounded-xl px-4 py-2.5"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {err}
              </div>
            )}

            <button data-testid="signup-submit" type="submit" disabled={loading} className="sm:col-span-2 crce-btn-primary w-full">
              {loading ? "Creating…" : "Create Account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: "var(--crce-text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--crce-primary)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}