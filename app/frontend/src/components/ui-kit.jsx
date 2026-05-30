export const StatCard = ({ label, value, hint, color = "blue", testId }) => {
  const palettes = {
    blue:  { bg: "linear-gradient(135deg,#0d9488 0%,#14b8a6 100%)", glow: "rgba(13,148,136,0.25)",  text: "#5eead4" },
    green: { bg: "linear-gradient(135deg,#059669 0%,#10b981 100%)", glow: "rgba(16,185,129,0.25)", text: "#6ee7b7" },
    amber: { bg: "linear-gradient(135deg,#d97706 0%,#f59e0b 100%)", glow: "rgba(245,158,11,0.25)",  text: "#fcd34d" },
    red:   { bg: "linear-gradient(135deg,#dc2626 0%,#ef4444 100%)", glow: "rgba(239,68,68,0.25)",   text: "#fca5a5" },
    slate: { bg: "linear-gradient(135deg,#475569 0%,#64748b 100%)", glow: "rgba(100,116,139,0.2)",  text: "#cbd5e1" },
  };
  const p = palettes[color] || palettes.blue;

  return (
    <div
      className="crce-card p-6 relative overflow-hidden"
      data-testid={testId}
      style={{ background: "rgba(255,255,255,0.78)" }}
    >
      {/* Soft colour orb in corner */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 pointer-events-none"
        style={{ background: p.bg, filter: "blur(16px)" }}
      />
      <div className="relative">
        <div className="crce-label">{label}</div>
        <div className="crce-stat-num mt-1">{value}</div>
        {hint && <div className="text-xs mt-1.5" style={{ color: "var(--crce-text-muted)" }}>{hint}</div>}
      </div>
      {/* Accent dot */}
      <div
        className="absolute bottom-5 right-5 h-8 w-8 rounded-xl flex items-center justify-center"
        style={{ background: p.bg, boxShadow: `0 4px 12px ${p.glow}` }}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-white opacity-90" />
      </div>
    </div>
  );
};

export const Badge = ({ children, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    blue:  "bg-teal-50 text-teal-700 border-teal-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red:   "bg-red-50 text-red-600 border-red-200",
  };
  return <span className={`crce-badge border ${tones[tone]}`}>{children}</span>;
};

export const StatusBadge = ({ status }) => {
  const map = {
    PENDING:     ["amber", "Pending"],
    ISSUED:      ["blue",  "Issued"],
    RETURNED:    ["green", "Returned"],
    REJECTED:    ["red",   "Rejected"],
    AVAILABLE:   ["green", "Available"],
    MAINTENANCE: ["amber", "Maintenance"],
    UNAVAILABLE: ["red",   "Unavailable"],
    IN_PROGRESS: ["amber", "In Progress"],
    COMPLETED:   ["green", "Completed"],
  };
  const [tone, label] = map[status] || ["slate", status];
  return <Badge tone={tone}>{label}</Badge>;
};

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
    <div>
      <h1 className="font-display text-3xl font-black tracking-tight" style={{ color: "var(--crce-text)" }}>{title}</h1>
      {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--crce-text-muted)" }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ title, hint }) => (
  <div className="crce-card p-12 text-center" style={{ background: "rgba(255,255,255,0.7)" }}>
    <div
      className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
      style={{ background: "linear-gradient(135deg,rgba(13,148,136,0.12) 0%,rgba(6,182,212,0.12) 100%)", color: "var(--crce-primary)" }}
    >
      ✦
    </div>
    <div className="font-display text-lg font-bold" style={{ color: "var(--crce-text)" }}>{title}</div>
    {hint && <div className="text-sm mt-1.5" style={{ color: "var(--crce-text-muted)" }}>{hint}</div>}
  </div>
);