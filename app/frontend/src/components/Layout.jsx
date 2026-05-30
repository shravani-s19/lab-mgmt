import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FlaskConical, Users, BarChart3, LogOut,
  ClipboardList, Wrench, GraduationCap, Beaker, Bell,
  UserCircle, ChevronLeft, ChevronRight, X, Lock, ShieldQuestion
} from "lucide-react";
import Chatbot from "@/components/Chatbot";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your primary school?",
  "What is your oldest sibling's name?",
  "What city were you born in?",
  "What is your favourite teacher's name?",
];

const NAVS = {
  ADMIN: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/labs", label: "Labs", icon: FlaskConical },
    { to: "/admin/users", label: "Users & Assistants", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  STUDENT: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/labs", label: "Browse Labs", icon: FlaskConical },
    { to: "/student/borrowed", label: "My Borrowed", icon: ClipboardList },
  ],
};

const roleColor = (role) => ({
  ADMIN:     "bg-teal-500/20 text-teal-300 border-teal-500/30",
  ASSISTANT: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  INCHARGE:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  STUDENT:   "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
}[role] || "bg-white/10 text-white/60 border-white/20");

// ── Profile Modal ──────────────────────────────────────────────
function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    name: user?.name || "", department: user?.department || "",
    year: user?.year || "", roll_no: user?.roll_no || "",
  });
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [sqForm, setSqForm] = useState({
    security_q1: SECURITY_QUESTIONS[0], security_a1: "",
    security_q2: SECURITY_QUESTIONS[1], security_a2: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const clearFeedback = () => { setMsg(""); setErr(""); };

  const saveProfile = async (e) => {
    e.preventDefault(); clearFeedback(); setLoading(true);
    try {
      await api.put("/users/me", form);
      setUser({ ...user, ...form });
      setMsg("Profile updated successfully!");
    } catch (e) { setErr(e?.response?.data?.detail || "Update failed"); }
    finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault(); clearFeedback();
    if (pwForm.new_password !== pwForm.confirm) { setErr("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.put("/users/me/password", { old_password: pwForm.old_password, new_password: pwForm.new_password });
      setMsg("Password changed successfully!");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (e) { setErr(e?.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const saveSecurityQuestions = async (e) => {
    e.preventDefault(); clearFeedback(); setLoading(true);
    try {
      await api.put("/users/me/security-questions", sqForm);
      setMsg("Security questions saved!");
    } catch (e) { setErr(e?.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserCircle },
    { id: "password", label: "Password", icon: Lock },
    ...(user?.role !== "ADMIN" ? [{ id: "security", label: "Security Questions", icon: ShieldQuestion }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden crce-fade-up"
        style={{ background: "#fff", boxShadow: "0 24px 64px rgba(13,148,136,0.18)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--crce-border-solid)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: "rgba(20,184,166,0.15)", color: "var(--crce-primary)" }}>
              {user?.name?.[0] || "U"}
            </div>
            <div>
              <div className="font-display font-bold" style={{ color: "var(--crce-text)" }}>{user?.name}</div>
              <div className="text-xs" style={{ color: "var(--crce-text-muted)" }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--crce-text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
              <button type="button" key={id} onClick={() => { setTab(id); clearFeedback(); }}              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === id
                ? { background: "rgba(13,148,136,0.1)", color: "var(--crce-primary)" }
                : { color: "var(--crce-text-muted)" }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {/* Feedback */}
          {msg && <div className="mb-4 text-sm rounded-xl px-4 py-2.5"
            style={{ color: "#0d9488", background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>{msg}</div>}
          {err && <div className="mb-4 text-sm rounded-xl px-4 py-2.5"
            style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{err}</div>}

          {/* Profile Tab */}
          {tab === "profile" && (
            <form onSubmit={saveProfile} className="space-y-4" autoComplete="off">
              <div>
                <label className="crce-label">Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  required className="crce-input" />
              </div>
              <div>
                <label className="crce-label">Department</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="crce-input" />
              </div>
              {user?.role === "STUDENT" && (
                <>
                  <div>
                    <label className="crce-label">Roll No</label>
                    <input value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })}
                      className="crce-input" />
                  </div>
                  <div>
                    <label className="crce-label">Year</label>
                    <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                      className="crce-input">
                      <option>FE</option><option>SE</option><option>TE</option><option>BE</option>
                    </select>
                  </div>
                </>
              )}
              <button type="submit" disabled={loading} className="crce-btn-primary w-full">
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {tab === "password" && (
            <form onSubmit={changePassword} className="space-y-4" autoComplete="off">
              <div>
                <label className="crce-label">Current Password</label>
                <input type="password" required value={pwForm.old_password}
                  onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })}
                  className="crce-input" placeholder="••••••••" />
              </div>
              <div>
                <label className="crce-label">New Password</label>
                <input type="password" required minLength={6} value={pwForm.new_password}
                  onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className="crce-input" placeholder="••••••••" />
              </div>
              <div>
                <label className="crce-label">Confirm New Password</label>
                <input type="password" required value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="crce-input" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="crce-btn-primary w-full">
                {loading ? "Changing…" : "Change Password"}
              </button>
            </form>
          )}

          {/* Security Questions Tab */}
          {tab === "security" && (
            <form onSubmit={saveSecurityQuestions} className="space-y-4" autoComplete="off">
              <p className="text-xs" style={{ color: "var(--crce-text-muted)" }}>
                These are used to recover your account if you forget your password.
              </p>
              <div>
                <label className="crce-label">Question 1</label>
                <select value={sqForm.security_q1}
                  onChange={e => setSqForm({ ...sqForm, security_q1: e.target.value })}
                  className="crce-input">
                  {SECURITY_QUESTIONS.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="crce-label">Answer 1</label>
                <input required value={sqForm.security_a1}
                  onChange={e => setSqForm({ ...sqForm, security_a1: e.target.value })}
                  className="crce-input" placeholder="Your answer" />
              </div>
              <div>
                <label className="crce-label">Question 2</label>
                <select value={sqForm.security_q2}
                  onChange={e => setSqForm({ ...sqForm, security_q2: e.target.value })}
                  className="crce-input">
                  {SECURITY_QUESTIONS.filter(q => q !== sqForm.security_q1).map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="crce-label">Answer 2</label>
                <input required value={sqForm.security_a2}
                  onChange={e => setSqForm({ ...sqForm, security_a2: e.target.value })}
                  className="crce-input" placeholder="Your answer" />
              </div>
              <button type="submit" disabled={loading} className="crce-btn-primary w-full">
                {loading ? "Saving…" : "Save Security Questions"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Security Questions Banner ──────────────────────────────────
function SecurityQuestionsBanner({ onSetup }) {
  const { user } = useAuth();
  if (user?.role === "ADMIN" || user?.role === "STUDENT") return null;
  return (
    <div className="mx-8 mt-4 rounded-xl px-4 py-3 flex items-center justify-between text-sm"
      style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#92400e" }}>
      <span>⚠️ You haven't set security questions yet — you won't be able to recover your password.</span>
      <button onClick={onSetup}
        className="ml-4 text-xs font-semibold underline whitespace-nowrap"
        style={{ color: "#b45309" }}>
        Set up now
      </button>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("profile");
  const [hasSecurityQ, setHasSecurityQ] = useState(true);

  const rolePrefix = user?.role === "INCHARGE" ? "incharge" : "assistant";
  const labBase = id ? `/${rolePrefix}/labs/${id}` : `/${rolePrefix}`;

  const navs = (user?.role === "ASSISTANT" || user?.role === "INCHARGE") ? [
    { to: `/${rolePrefix}/labs`, label: "My Labs", icon: FlaskConical },
    { to: labBase, label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: `${labBase}/equipment`, label: "Equipment", icon: Beaker },
    { to: `${labBase}/requests`, label: "Requests", icon: ClipboardList },
    { to: `${labBase}/maintenance`, label: "Maintenance", icon: Wrench },
  ] : (NAVS[user?.role] || []);

  useEffect(() => {
    if (user?.role === "ASSISTANT" || user?.role === "INCHARGE") {
      api.get("/users/me/security-questions-status")
        .then(r => setHasSecurityQ(r.data.has_security_questions))
        .catch(() => {});
    }
  }, [user]);

  const openProfileOnSecurity = () => {
    setProfileTab("security");
    setShowProfile(true);
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const sidebarW = collapsed ? 64 : 256;

  return (
    <div className="min-h-screen text-[#0f2b35]">
      {showProfile && (
        <ProfileModal
          initialTab={profileTab}
          onClose={() => { setShowProfile(false); setProfileTab("profile"); }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        data-testid="sidebar"
        className="fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300"
        style={{
          width: sidebarW,
          background: "linear-gradient(160deg, #0f2b35 0%, #0d4a48 60%, #0d6e6a 100%)",
          boxShadow: "4px 0 32px rgba(13,148,136,0.18)"
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 overflow-hidden">
          <div className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)", boxShadow: "0 4px 14px rgba(20,184,166,0.4)" }}>
            <GraduationCap size={18} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-display font-black tracking-tight leading-none text-white whitespace-nowrap">CRCE Lab</div>
              <div className="text-[11px] font-mono whitespace-nowrap" style={{ color: "rgba(94,234,212,0.7)" }}>Manager v2</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-5 space-y-1 overflow-y-auto">
          {navs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              data-testid={`nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "text-[#5eead4] font-semibold" : "text-white/60 hover:text-white hover:bg-white/8"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(20,184,166,0.15)", boxShadow: "inset 3px 0 0 #14b8a6"
              } : {}}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-2 border-t border-white/10">
          <div className={`px-2 py-2.5 rounded-xl flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-sm text-[#5eead4]"
              style={{ background: "rgba(20,184,166,0.2)", border: "1.5px solid rgba(94,234,212,0.3)" }}>
              {user?.name?.[0] || "U"}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                  <span className={`crce-badge border text-[10px] px-2 py-0.5 ${roleColor(user?.role)}`}>{user?.role}</span>
                </div>
                <button
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.15)"; e.currentTarget.style.color="#f87171"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.4)"; }}
                  title="Logout">
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full flex items-center justify-center z-40 transition-all"
          style={{ background: "#0d9488", color: "#fff", boxShadow: "0 2px 8px rgba(13,148,136,0.4)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Top Header ── */}
      <header
        className="sticky top-0 z-20 h-16 flex items-center justify-between px-8 transition-all duration-300"
        style={{
          marginLeft: sidebarW,
          background: "rgba(238,244,247,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(13,148,136,0.12)",
          boxShadow: "0 2px 16px rgba(13,148,136,0.06)"
        }}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--crce-primary)" }}>
            {user?.role}
          </div>
          <div className="font-display font-semibold text-[#0f2b35]">
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bell */}
          <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 crce-card"
            style={{ color: "var(--crce-text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color="var(--crce-primary)"}
            onMouseLeave={e => e.currentTarget.style.color="var(--crce-text-muted)"}>
            <Bell size={18} />
          </button>
          {/* Profile */}
          <button
            onClick={() => { setProfileTab("profile"); setShowProfile(true); }}
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 crce-card"
            style={{ color: "var(--crce-text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color="var(--crce-primary)"}
            onMouseLeave={e => e.currentTarget.style.color="var(--crce-text-muted)"}
            title="My Profile">
            <UserCircle size={18} />
          </button>
        </div>
      </header>

      {/* ── Security Questions Banner ── */}
      {!hasSecurityQ && (
        <div style={{ marginLeft: sidebarW }} className="transition-all duration-300">
          <SecurityQuestionsBanner onSetup={openProfileOnSecurity} />
        </div>
      )}

      {/* ── Main content ── */}
      <main
        className="p-8 crce-fade-up transition-all duration-300"
        style={{ marginLeft: sidebarW }}>
        {children}
      </main>

      <Chatbot />
    </div>
  );
}