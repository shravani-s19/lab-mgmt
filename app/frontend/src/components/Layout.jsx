import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FlaskConical, Users, BarChart3, LogOut,
  ClipboardList, Wrench, GraduationCap, Beaker, Bell
} from "lucide-react";
import Chatbot from "@/components/Chatbot";
import { useParams } from "react-router-dom";




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
  STUDENT:   "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
}[role] || "bg-white/10 text-white/60 border-white/20");

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const labBase = id ? `/assistant/labs/${id}` : "/assistant";
  const navs = user?.role === "ASSISTANT" ? [
    { to: "/assistant/labs", label: "My Labs", icon: FlaskConical },
    { to: labBase, label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: `${labBase}/equipment`, label: "Equipment", icon: Beaker },
    { to: `${labBase}/requests`, label: "Requests", icon: ClipboardList },
    { to: `${labBase}/maintenance`, label: "Maintenance", icon: Wrench },
  ] : (NAVS[user?.role] || []);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen text-[#0f2b35]">
      {/* ── Sidebar ── */}
      <aside
        data-testid="sidebar"
        className="fixed inset-y-0 left-0 z-30 w-64 flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0f2b35 0%, #0d4a48 60%, #0d6e6a 100%)",
          boxShadow: "4px 0 32px rgba(13,148,136,0.18)"
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)", boxShadow: "0 4px 14px rgba(20,184,166,0.4)" }}>
            <GraduationCap size={18} />
          </div>
          <div>
            <div className="font-display font-black tracking-tight leading-none text-white">CRCE Lab</div>
            <div className="text-[11px] font-mono" style={{ color: "rgba(94,234,212,0.7)" }}>Manager v2</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-[#5eead4] font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(20,184,166,0.15)",
                boxShadow: "inset 3px 0 0 #14b8a6"
              } : {}}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2.5 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-9 w-9 rounded-full flex items-center justify-center font-display font-bold text-sm text-[#5eead4] flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.2)", border: "1.5px solid rgba(94,234,212,0.3)" }}>
              {user?.name?.[0] || "U"}
            </div>
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
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-20 ml-64 h-16 flex items-center justify-between px-8"
        style={{
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
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 crce-card"
            style={{ color: "var(--crce-text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color="var(--crce-primary)"}
            onMouseLeave={e => e.currentTarget.style.color="var(--crce-text-muted)"}
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="ml-64 p-8 crce-fade-up">{children}</main>
      <Chatbot />
    </div>
  );
}