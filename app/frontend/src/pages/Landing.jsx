import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ── Inline SVG Icons ── */
const Icon = ({ name, size = 22, color = "currentColor" }) => {
  const icons = {
    equipment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        <path d="M7 8h.01M11 8h.01M15 8h.01M7 11h4"/>
      </svg>
    ),
    request: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    maintenance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    registry: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    admin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    assistant: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    student: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    ),
    dot: (
      <svg width={8} height={8} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={color}/></svg>
    ),
  };
  return icons[name] || null;
};

/* ── Scroll-reveal hook ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Reveal wrapper ── */
function Reveal({ children, delay = 0, direction = "up", threshold = 0.15 }) {
  const [ref, visible] = useScrollReveal(threshold);
  const transforms = { up: "translateY(36px)", down: "translateY(-36px)", left: "translateX(36px)", right: "translateX(-36px)" };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : transforms[direction],
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
      willChange: "opacity, transform",
    }}>
      {children}
    </div>
  );
}

/* ── Floating orb ── */
function Orb({ style }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%",
      filter: "blur(80px)", pointerEvents: "none", ...style
    }} />
  );
}

/* ── CSS keyframes injected once ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-12px) rotate(1deg); }
    66% { transform: translateY(-6px) rotate(-1deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes gradient-drift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }

  .nav-btn:hover { background: rgba(20,184,166,0.25) !important; transform: translateY(-1px); }
  .nav-btn { transition: all 0.2s ease; }

  .cta-primary { transition: all 0.2s ease; }
  .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(20,184,166,0.35) !important; }

  .cta-secondary { transition: all 0.2s ease; }
  .cta-secondary:hover { background: rgba(255,255,255,0.12) !important; transform: translateY(-2px); }

  .feature-card { transition: all 0.3s cubic-bezier(.22,.68,0,1.2); }
  .feature-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(94,234,212,0.35) !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(94,234,212,0.15) !important;
  }

  .role-card { transition: all 0.3s cubic-bezier(.22,.68,0,1.2); }
  .role-card:hover { transform: translateY(-4px); }

  .stat-item { transition: all 0.2s ease; }
  .stat-item:hover .stat-num { color: white !important; }

  .shimmer-text {
    background: linear-gradient(90deg, #5eead4 0%, #a5f3fc 40%, #5eead4 60%, #a5f3fc 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
`;

/* ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { name: "Equipment Tracking", desc: "Monitor availability, quantities, and status of all lab equipment in real time.", icon: "equipment", color: "#14b8a6", bg: "rgba(20,184,166,0.12)" },
    { name: "Request Management", desc: "Students raise requests, assistants approve or reject — all in one place.", icon: "request", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
    { name: "Maintenance Logs", desc: "Track repairs, costs, and servicing history for every piece of equipment.", icon: "maintenance", color: "#0d9488", bg: "rgba(13,148,136,0.12)" },
    { name: "Asset Registry", desc: "Import from Excel or PDF and export year-end reports with a single click.", icon: "registry", color: "#0891b2", bg: "rgba(8,145,178,0.12)" },
  ];

  const roles = [
    { role: "Admin", icon: "admin", desc: "Create labs, assign assistants, manage budgets, and view analytics.", color: "#0d9488", bg: "rgba(13,148,136,0.07)", border: "rgba(13,148,136,0.25)", iconBg: "rgba(13,148,136,0.15)" },
    { role: "Assistant", icon: "assistant", desc: "Manage equipment, approve requests, and log maintenance across assigned labs.", color: "#0891b2", bg: "rgba(8,145,178,0.07)", border: "rgba(8,145,178,0.25)", iconBg: "rgba(8,145,178,0.15)" },
    { role: "Student", icon: "student", desc: "Browse labs, request equipment, and track borrowed items easily.", color: "#6366f1", bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.25)", iconBg: "rgba(99,102,241,0.15)" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, padding: 0 }}>
      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: "linear-gradient(155deg, #132f3a 0%, #0e5550 55%, #1a7a74 100%)",
        position: "relative", overflow: "hidden",
      }}>

        {/* Ambient orbs */}
        <Orb style={{ width: 480, height: 480, top: -120, left: -100, background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)" }} />
        <Orb style={{ width: 360, height: 360, top: "30%", right: -80, background: "radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)" }} />
        <Orb style={{ width: 280, height: 280, bottom: 80, left: "40%", background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }} />

        {/* Decorative grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(94,234,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* ── NAV ── */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 2.5rem",
          borderBottom: `1px solid ${scrolled ? "rgba(94,234,212,0.15)" : "rgba(255,255,255,0.07)"}`,
          backdropFilter: scrolled ? "blur(14px)" : "none",
          background: scrolled ? "rgba(13,47,58,0.75)" : "transparent",
          position: "sticky", top: 0, zIndex: 100,
          transition: "all 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "white", fontSize: 17, letterSpacing: "-0.5px",
              boxShadow: "0 4px 14px rgba(20,184,166,0.4)",
              animation: "float 5s ease-in-out infinite",
            }}>C</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>CRCE Lab Manager</div>
              <div style={{ fontSize: 10, color: "rgba(94,234,212,0.65)", fontFamily: "'JetBrains Mono', monospace" }}>v2 · ECS Department</div>
            </div>
          </div>
          <button className="nav-btn" onClick={() => navigate("/login")} style={{
            padding: "0.5rem 1.25rem", borderRadius: 8, cursor: "pointer",
            background: "rgba(20,184,166,0.12)", border: "1px solid rgba(94,234,212,0.28)",
            color: "#5eead4", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            Sign in <Icon name="arrow" size={14} color="#5eead4" />
          </button>
        </nav>

        {/* ── HERO BODY ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "4rem 2rem 3rem",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "0.38rem 1.1rem", borderRadius: 999,
            background: "rgba(20,184,166,0.1)", border: "1px solid rgba(94,234,212,0.22)",
            color: "#5eead4", fontSize: 12, fontWeight: 600, marginBottom: "1.75rem",
            animation: "fadeUp 0.7s ease both",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5eead4", display: "block" }} />
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%", background: "#5eead4",
                animation: "pulse-ring 1.6s ease-out infinite",
              }} />
            </span>
            Fr. Conceicao Rodrigues College of Engineering
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: "clamp(38px, 6vw, 62px)", fontWeight: 800, color: "white",
            lineHeight: 1.08, marginBottom: "1.1rem", letterSpacing: "-1.5px",
            animation: "fadeUp 0.7s ease 0.1s both",
          }}>
            Lab Management<br />
            <span className="shimmer-text">Made Simple</span>
          </h1>

          <p style={{
            fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 460,
            lineHeight: 1.65, marginBottom: "2.5rem",
            animation: "fadeUp 0.7s ease 0.2s both",
          }}>
            A unified platform to manage lab equipment, track requests, and streamline maintenance across all ECS laboratories.
          </p>

          {/* CTAs */}
          <div style={{
            display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
            animation: "fadeUp 0.7s ease 0.3s both",
          }}>
            <button className="cta-primary" onClick={() => navigate("/login")} style={{
              padding: "0.78rem 2rem", borderRadius: 11, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
              color: "white", fontSize: 15, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 6px 20px rgba(20,184,166,0.28)",
            }}>
              Get Started <Icon name="arrow" size={16} color="white" />
            </button>
            <button className="cta-secondary" onClick={() => navigate("/signup")} style={{
              padding: "0.78rem 2rem", borderRadius: 11, cursor: "pointer",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 600,
              backdropFilter: "blur(8px)",
            }}>
              Create Account
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex", marginTop: "3.5rem",
            borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(94,234,212,0.15)",
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(16px)",
            maxWidth: 520, width: "100%",
            animation: "fadeUp 0.7s ease 0.4s both",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {[["5+","Labs"],["500+","Equipment"],["3","Roles"],["Real-time","Tracking"]].map(([num, label], i, arr) => (
              <div key={label} className="stat-item" style={{
                flex: 1, padding: "1.15rem 0.75rem", textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                cursor: "default",
              }}>
                <div className="stat-num" style={{ fontSize: 22, fontWeight: 800, color: "#5eead4", letterSpacing: "-0.5px", transition: "color 0.2s" }}>{num}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, transparent, rgba(15,35,40,0.4))", pointerEvents: "none" }} />
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: "5rem 2rem", background: "linear-gradient(180deg, #f0fafa 0%, #f8fafc 100%)" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.6rem",
            }}>Features</div>
            <div style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, color: "#0f2b35", letterSpacing: "-0.5px" }}>Everything you need</div>
            <div style={{ fontSize: 15, color: "#64748b", marginTop: "0.5rem", fontWeight: 400 }}>Built for admins, assistants, and students</div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, maxWidth: 860, margin: "0 auto" }}>
          {features.map((f, i) => (
            <Reveal key={f.name} delay={i * 80} direction="up">
              <div className="feature-card" style={{
                background: "rgba(255,255,255,0.75)",
                borderRadius: 18,
                border: "1px solid rgba(20,184,166,0.12)",
                padding: "1.6rem 1.4rem",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                cursor: "default",
                height: "100%",
              }}>
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: f.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1rem",
                  boxShadow: `0 4px 12px ${f.bg}`,
                }}>
                  <Icon name={f.icon} size={22} color={f.color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f2b35", marginBottom: "0.4rem", letterSpacing: "-0.1px" }}>{f.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── ROLES ── */}
      <div style={{ padding: "5rem 2rem", background: "white", position: "relative", overflow: "hidden" }}>
        {/* Subtle bg decoration */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 320, height: 320,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.6rem",
            }}>Roles</div>
            <div style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: "#0f2b35", letterSpacing: "-0.5px" }}>One system, three roles</div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 740, margin: "0 auto" }}>
          {roles.map((r, i) => (
            <Reveal key={r.role} delay={i * 100} direction="up">
              <div className="role-card" style={{
                borderRadius: 16, padding: "1.6rem 1.25rem",
                border: `1px solid ${r.border}`,
                background: r.bg,
                textAlign: "center",
                backdropFilter: "blur(8px)",
                cursor: "default",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: r.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                  boxShadow: `0 4px 14px ${r.iconBg}`,
                }}>
                  <Icon name={r.icon} size={24} color={r.color} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: r.color, marginBottom: "0.5rem" }}>{r.role}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{r.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div style={{ padding: "4rem 2rem", background: "linear-gradient(135deg, #132f3a 0%, #0e5550 100%)", position: "relative", overflow: "hidden" }}>
        <Orb style={{ width: 300, height: 300, top: -80, left: -60, background: "radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)" }} />
        <Orb style={{ width: 240, height: 240, bottom: -60, right: -40, background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)" }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(94,234,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <Reveal>
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: "white", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>
              Ready to get started?
            </div>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
              Join your lab community on CRCE Lab Manager today.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="cta-primary" onClick={() => navigate("/login")} style={{
                padding: "0.78rem 2rem", borderRadius: 11, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
                color: "white", fontSize: 15, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(20,184,166,0.3)",
              }}>
                Sign In <Icon name="arrow" size={16} color="white" />
              </button>
              <button className="cta-secondary" onClick={() => navigate("/signup")} style={{
                padding: "0.78rem 2rem", borderRadius: 11, cursor: "pointer",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}>
                Create Account
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: "1.5rem 2rem", textAlign: "center",
        background: "#0c2028",
        color: "rgba(255,255,255,0.28)", fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        borderTop: "1px solid rgba(94,234,212,0.08)",
      }}>
        © 2025 Fr. Conceicao Rodrigues College of Engineering · ECS Department · CRCE Lab Manager v2
      </div>
    </div>
  );
}