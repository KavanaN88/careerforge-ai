const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ---------- Icon set (hand-picked minimal line icons, no external icon lib needed) ----------
const ICON_PATHS = {
  cloud: "M17.5 19H8a5 5 0 1 1 1.3-9.8A6 6 0 0 1 21 11.5a4 4 0 0 1-.3 8H17.5z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H11a1.6 1.6 0 0 0 1-1.5V5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V11a1.6 1.6 0 0 0 1.5 1H19a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  code: "m9 18-6-6 6-6M15 6l6 6-6 6",
  layers: "m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  "brain-circuit": "M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 2.8V12a3 3 0 0 0 1.5 2.6A3 3 0 0 0 8 19a3 3 0 0 0 3-2.6M9 3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3M9 3v16m6-16a3 3 0 0 1 3 3v1a3 3 0 0 1 2 2.8V12a3 3 0 0 1-1.5 2.6A3 3 0 0 1 16 19a3 3 0 0 1-3-2.6",
  shield: "M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3z",
  "bar-chart-3": "M3 21h18M7 21V9m5 12V4m5 17v-7",
  home: "m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  "git-branch": "M6 3v10a4 4 0 0 0 4 4h4M18 6a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM6 6a3 3 0 1 0-6 0M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6M9 9h1",
  briefcase: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  "message-circle": "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  "trending-up": "m23 6-9.5 9.5-5-5L1 18M17 6h6v6",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1",
  "chevron-right": "m9 18 6-6-6-6",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-down": "m6 9 6 6 6-6",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  "alert-triangle": "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  github: "M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.1-.5 2V21",
  upload: "M12 3v12M7 8l5-5 5 5M5 21h14",
  sparkles: "m12 3 1.9 4.9L19 9.8l-5.1 1.9L12 16.6l-1.9-4.9L5 9.8l5.1-1.9L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 14l.6 1.6L7 16.2l-1.4.6L5 18.4l-.6-1.6L3 16.2l1.4-.6L5 14z",
  search: "m21 21-4.3-4.3M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0z",
  "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  play: "M5 3l16 9-16 9V3z",
  send: "m22 2-7 20-4-9-9-4 20-7z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  zap: "M13 2 3 14h7l-1 8 11-14h-7l1-6z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  link: "M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8",
  refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 2z",
  eye: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "eye-off": "M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22",
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  server: "M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01",
  smartphone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  cpu: "M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4",
  gamepad: "M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-3.9 3.2l-1.4 7A3 3 0 0 0 5.3 19c.8 0 1.5-.4 2-1l1.2-1.5h7l1.2 1.5c.5.6 1.2 1 2 1a3 3 0 0 0 3.9-3.8l-1.4-7A4 4 0 0 0 17.3 5z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  bug: "M8 6a4 4 0 0 1 8 0v1H8zM6 11h12v3a6 6 0 0 1-12 0zM3 13h3M18 13h3M4 7l3 2M20 7l-3 2M4 20l3-2M20 20l-3-2",
  bot: "M12 8V4M8 4h8M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 14h.01M15 14h.01",
  radio: "M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  headset: "M3 14v-2a9 9 0 0 1 18 0v2M3 14h3v5H4a1 1 0 0 1-1-1zM21 14h-3v5h2a1 1 0 0 0 1-1z",
  clipboard: "M9 3h6v4H9zM7 5H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M8 12h8M8 16h5",
  flask: "M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3",
  building: "M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h.01M17 17h.01M2 21h20",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  terminal: "m4 17 6-5-6-5M12 19h8",
  star2: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 2z",
  filter: "M3 4h18l-7 8v6l-4 2v-8z",
  bookmark: "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2",
};

function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// ---------- Layout primitives ----------
function Card({ children, className = "", glow = false, ...props }) {
  return (
    <div className={`glass rounded-2xl ${glow ? "shadow-glow" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

function Badge({ children, tone = "indigo", className = "" }) {
  const tones = {
    indigo: "bg-indigo/15 text-indigo border-indigo/30",
    cyan: "bg-cyan/15 text-cyan border-cyan/30",
    good: "bg-good/15 text-good border-good/30",
    warn: "bg-warn/15 text-warn border-warn/30",
    bad: "bg-bad/15 text-bad border-bad/30",
    mute: "bg-mute/10 text-mute border-mute/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", size = "md", className = "", icon, iconRight, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-display font-medium rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "text-sm px-3.5 py-2", md: "text-sm px-5 py-2.5", lg: "text-base px-7 py-3.5" };
  const variants = {
    primary: "bg-gradient-to-r from-indigo to-cyan text-white hover:brightness-110 shadow-glow",
    secondary: "bg-panel2 text-ink border border-line hover:border-indigo/50 hover:bg-panel2/70",
    ghost: "text-mute hover:text-ink hover:bg-white/5",
    outline: "border border-indigo/40 text-indigo hover:bg-indigo/10",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {icon && <Icon name={icon} size={size === "lg" ? 20 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 20 : 16} />}
    </button>
  );
}

function ScoreRing({ score, size = 120, stroke = 10, label, sub, colorClass = "text-indigo" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clampNum(score) / 100) * c;
  const color = score >= 75 ? "#22C55E" : score >= 45 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="ring-anim" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-2xl">{Math.round(score)}</span>
        {label && <span className="text-[10px] text-mute uppercase tracking-wider mt-0.5">{label}</span>}
        {sub && <span className="text-[10px] text-mute">{sub}</span>}
      </div>
    </div>
  );
}
function clampNum(n) { return Math.max(0, Math.min(100, n)); }

function ScoreBar({ label, score, showValue = true, size = "md" }) {
  const color = score >= 75 ? "bg-good" : score >= 45 ? "bg-warn" : "bg-bad";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-ink/90">{label}</span>
          {showValue && <span className="font-mono text-xs text-mute">{Math.round(score)}/100</span>}
        </div>
      )}
      <div className={`w-full ${h} rounded-full bg-white/5 overflow-hidden`}>
        <div className={`${h} ${color} rounded-full transition-all duration-700`} style={{ width: `${clampNum(score)}%` }} />
      </div>
    </div>
  );
}

function Chip({ children, active, onClick, className = "" }) {
  return (
    <button onClick={onClick}
      className={`chip px-3 py-1.5 rounded-full text-sm transition-colors ${active ? "!bg-indigo/20 !border-indigo/50 text-white" : "text-mute hover:text-ink"} ${className}`}>
      {children}
    </button>
  );
}

function SectionTitle({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
      <div>
        {eyebrow && <div className="text-cyan text-xs font-mono uppercase tracking-[0.2em] mb-2">{eyebrow}</div>}
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{title}</h2>
        {sub && <p className="text-mute mt-1.5 max-w-2xl">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function EvidenceRow({ ok, children }) {
  return (
    <div className="flex items-center gap-2.5 text-sm py-1">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-good/15 text-good" : "bg-bad/15 text-bad"}`}>
        <Icon name={ok ? "check" : "x"} size={12} strokeWidth={2.5} />
      </span>
      <span className={ok ? "text-ink/90" : "text-mute"}>{children}</span>
    </div>
  );
}

function EmptyState({ icon = "sparkles", title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo/10 border border-indigo/25 flex items-center justify-center mb-4 text-indigo">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="font-display text-lg font-medium mb-1.5">{title}</h3>
      {sub && <p className="text-mute text-sm max-w-sm mb-5">{sub}</p>}
      {action}
    </div>
  );
}

function Modal({ open, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-strong rounded-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto fade-up shadow-glow`}>
        {children}
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return <span className="inline-block spin-slow" style={{ width: size, height: size }}><Icon name="refresh" size={size} /></span>;
}

// Fades content in once it scrolls into view. Falls back to always-visible if
// IntersectionObserver is unavailable, and respects prefers-reduced-motion.
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setVisible(true); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(.2,.7,.2,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// Animates a number from 0 to `target` over `durationMs`, driven by requestAnimationFrame
// (guaranteed to terminate — no setInterval loop to forget to clear). `active` gates when
// the count-up starts; set it false to hold at 0.
function useCountUp(target, durationMs = 1200, active = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setValue(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - pct, 3);
      setValue(Math.round(target * eased));
      if (pct < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, durationMs, active]);

  return value;
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Shows a real score, or an honest "not yet" state instead of a bare, broken-looking 0/100.
function ScoreOrEmpty({ score, hasData, emptyLabel, size = 100, stroke = 9 }) {
  if (!hasData) {
    return (
      <div className="relative inline-flex flex-col items-center justify-center text-center" style={{ width: size, height: size }}>
        <div className="rounded-full border-2 border-dashed border-line flex items-center justify-center" style={{ width: size, height: size }}>
          <Icon name="clock" size={size * 0.22} className="text-mute" />
        </div>
        <span className="text-[10px] text-mute mt-2 max-w-[90px] leading-tight">{emptyLabel}</span>
      </div>
    );
  }
  return <ScoreRing score={score} size={size} stroke={stroke} />;
}

const NOTIFICATIONS_SAMPLE = [
  { icon: "github", text: "Your GitHub analysis is complete.", tone: "cyan" },
  { icon: "trending-up", text: "Your Career Readiness improved.", tone: "good" },
  { icon: "layers", text: "New proof-of-skill project available.", tone: "indigo" },
];

function NotificationBell({ items }) {
  const [open, setOpen] = useState(false);
  const list = items && items.length ? items : [];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-white/5 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {list.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan" />}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-72 glass-strong rounded-xl shadow-glow overflow-hidden z-40 fade-up">
          <div className="px-4 py-3 border-b border-line text-xs font-mono uppercase tracking-wider text-mute">Notifications</div>
          {list.length === 0 ? (
            <div className="px-4 py-6 text-sm text-mute text-center">You're all caught up.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {list.map((n, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 border-b border-line last:border-0 hover:bg-white/5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-${n.tone}/15 text-${n.tone}`}><Icon name={n.icon} size={13} /></span>
                  <span className="text-sm text-ink/90 leading-snug">{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
