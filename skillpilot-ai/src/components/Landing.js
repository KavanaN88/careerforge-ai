function ParticleField({ count = 22 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const seed = hashString("particle-" + i);
      const top = seededRandom(seed) * 100;
      const left = seededRandom(seed + 1) * 100;
      const size = 1 + seededRandom(seed + 2) * 2.2;
      const duration = 10 + seededRandom(seed + 3) * 14;
      const delay = seededRandom(seed + 4) * -20;
      const opacity = 0.2 + seededRandom(seed + 5) * 0.35;
      const cyan = seededRandom(seed + 6) > 0.5;
      return { id: i, top, left, size, duration, delay, opacity, cyan };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <span key={p.id} className="absolute rounded-full particle-float"
          style={{
            top: `${p.top}%`, left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`,
            background: p.cyan ? "#06B6D4" : "#818CF8", opacity: p.opacity,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>
  );
}

function LandingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 grid-fade" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0) 65%)" }} />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0) 65%)" }} />
      <ParticleField />
    </div>
  );
}

const NAV_LINKS = [
  { id: "capabilities", label: "Features" },
  { id: "how", label: "How It Works" },
  { id: "careers", label: "Careers" },
  { id: "loop", label: "The Loop" },
];

function NavBar({ onGetStarted, onLogin, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-40 transition-colors ${scrolled ? "bg-navy/90 border-b border-line backdrop-blur-md" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center">
            <Icon name="target" size={17} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">SkillPilot <span className="text-gradient">AI</span></span>
        </div>
        <nav className="hidden lg:flex items-center gap-7 text-sm text-mute">
          {NAV_LINKS.map(l => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => { e.preventDefault(); onNav(l.id); }} className="hover:text-ink transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onLogin}>Log in</Button>
          <Button variant="primary" size="sm" onClick={onGetStarted} iconRight="arrow-right">Build My Career Twin</Button>
        </div>
      </div>
    </header>
  );
}

// =========================================================================
// HERO ANIMATION — "Your data → AI analysis → Career Digital Twin"
// A short, self-contained build sequence, then it settles into a permanent
// live-looking Career Digital Twin panel (it never disappears or resets).
// =========================================================================

const EVIDENCE_NODES = [
  { key: "github", label: "GitHub", icon: "github" },
  { key: "resume", label: "Resume", icon: "file-text" },
  { key: "projects", label: "Projects", icon: "layers" },
  { key: "assessment", label: "AI Assessment", icon: "brain-circuit" },
];

const STATUS_MESSAGES = [
  "Analyzing GitHub...",
  "Reading resume...",
  "Evaluating skills...",
  "Checking project evidence...",
  "Finding skill gaps...",
];

const HERO_SKILLS = [
  { name: "Python", score: 91, status: "Strong", tone: "good" },
  { name: "SQL", score: 84, status: "Strong", tone: "good" },
  { name: "Machine Learning", score: 72, status: "Developing", tone: "warn" },
  { name: "Docker", score: 63, status: "Developing", tone: "warn" },
  { name: "Kubernetes", score: 28, status: "Critical Gap", tone: "bad" },
];

const HERO_READINESS = 78;

// Phase timings (ms), tuned to land the whole sequence at ~5.5s total.
const T_NODES_START = 0;
const T_NODE_STEP = 260;
const T_CONNECT = 1100;
const T_STATUS_START = 1400;
const T_STATUS_STEP = 420;
const T_TWIN_REVEAL = 1400 + STATUS_MESSAGES.length * 420 + 200; // ~3700
const T_SKILLS_REVEAL = T_TWIN_REVEAL + 900; // ~4600
const T_GAP_CALLOUT = T_SKILLS_REVEAL + 900; // ~5500
const T_DONE = T_GAP_CALLOUT + 400;

function useHeroSequence() {
  // phase: 0 idle/nodes, 1 connecting, 2 analyzing (status cycling), 3 twin revealed,
  // 4 skills revealed, 5 gap callout, 6 done (final resting state)
  const [phase, setPhase] = useState(0);
  const [nodesShown, setNodesShown] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const timers = useRef([]);

  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const skipToEnd = () => {
    clearAll();
    setNodesShown(EVIDENCE_NODES.length);
    setStatusIndex(STATUS_MESSAGES.length - 1);
    setPhase(6);
  };

  useEffect(() => {
    if (prefersReducedMotion()) { skipToEnd(); return () => clearAll(); }

    EVIDENCE_NODES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setNodesShown(i + 1), T_NODES_START + i * T_NODE_STEP));
    });
    timers.current.push(setTimeout(() => setPhase(1), T_CONNECT));
    timers.current.push(setTimeout(() => setPhase(2), T_STATUS_START));
    STATUS_MESSAGES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStatusIndex(i), T_STATUS_START + i * T_STATUS_STEP));
    });
    timers.current.push(setTimeout(() => setPhase(3), T_TWIN_REVEAL));
    timers.current.push(setTimeout(() => setPhase(4), T_SKILLS_REVEAL));
    timers.current.push(setTimeout(() => setPhase(5), T_GAP_CALLOUT));
    timers.current.push(setTimeout(() => setPhase(6), T_DONE));

    return clearAll;
  }, []);

  return { phase, nodesShown, statusIndex, skipToEnd };
}

function HeroTwinPanel() {
  const { phase, nodesShown, statusIndex, skipToEnd } = useHeroSequence();
  const done = phase >= 6;
  const readinessActive = phase >= 3;
  const readinessValue = useCountUp(HERO_READINESS, 1400, readinessActive);

  return (
    <Card className="p-5 md:p-6 fade-up relative" glow role="img"
      aria-label="Animated illustration of SkillPilot AI building a Career Digital Twin from GitHub, resume, project and assessment evidence, reaching a Career Readiness of 78 out of 100 with a critical gap in Kubernetes.">
      {!done && (
        <button onClick={skipToEnd} className="absolute top-3 right-3 z-20 text-[11px] text-mute hover:text-ink chip px-2.5 py-1 rounded-full">
          Skip animation
        </button>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-medium">Your Career Digital Twin</span>
          <Badge tone="cyan" className="!py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan inline-block node-pulse" /> Live</Badge>
        </div>
        <span className="text-[11px] text-mute hidden sm:inline">Yours updates as you add evidence</span>
      </div>

      {/* Phase 0–2: evidence nodes converging on an AI analysis point */}
      {phase < 3 && (
        <div className="mb-5">
          <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap mb-5">
            {EVIDENCE_NODES.map((n, i) => (
              <div key={n.key} className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${i < nodesShown ? "opacity-100 float-in" : "opacity-0"}`}>
                <div className={`w-12 h-12 rounded-2xl glass flex items-center justify-center text-indigo ${phase >= 1 ? "shadow-glow" : ""}`}>
                  <Icon name={n.icon} size={19} />
                </div>
                <span className="text-[10px] text-mute">{n.label}</span>
              </div>
            ))}
          </div>

          {phase >= 1 && (
            <div className="relative h-16 mb-2">
              <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
                {[40, 150, 260, 360].map((x, i) => (
                  <line key={i} x1={x} y1="0" x2="200" y2="55" stroke="#6366F1" strokeOpacity="0.35" strokeWidth="1.5" className="dash-flow" />
                ))}
              </svg>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 border-cyan/50 flex items-center justify-center text-cyan ${phase === 2 ? "spin-slow" : ""}`}>
                  <Icon name="sparkles" size={16} />
                </div>
              </div>
            </div>
          )}

          <div className="text-center h-5">
            {phase === 2 && <span className="text-xs font-mono text-cyan">{STATUS_MESSAGES[statusIndex]}</span>}
            {phase < 2 && <span className="text-xs font-mono text-mute">AI ANALYSIS</span>}
          </div>
        </div>
      )}

      {/* Phase 3+: the Career Digital Twin itself */}
      {phase >= 3 && (
        <div className="fade-up">
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center mb-5">
            <ScoreRing score={readinessValue} size={128} stroke={11} label="Readiness" />
            <div className="space-y-3 w-full">
              {HERO_SKILLS.map((s, i) => (
                <HeroSkillRow key={s.name} skill={s} active={phase >= 4} delayMs={i * 140} />
              ))}
            </div>
          </div>

          {phase >= 5 && (
            <div className="glass rounded-xl p-4 mb-4 border-warn/30 fade-up flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[10px] text-warn uppercase tracking-wider font-mono mb-0.5 flex items-center gap-1">
                  <Icon name="alert-triangle" size={11} /> Critical skill gap detected
                </div>
                <div className="text-sm font-medium">Kubernetes — 28%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-cyan uppercase tracking-wider font-mono mb-0.5">Next best action</div>
                <div className="text-sm font-medium">Build a Kubernetes project</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="glass rounded-xl p-3 text-center"><div className="font-mono text-lg font-semibold text-cyan">76<span className="text-mute text-xs">/100</span></div><div className="text-[10px] text-mute mt-0.5">GitHub Score</div></div>
            <div className="glass rounded-xl p-3 text-center"><div className="font-mono text-lg font-semibold text-indigo">82%</div><div className="text-[10px] text-mute mt-0.5">Resume Match</div></div>
            <div className="glass rounded-xl p-3 text-center"><div className="font-mono text-lg font-semibold text-good">4 / 6</div><div className="text-[10px] text-mute mt-0.5">Project Evidence</div></div>
            <div className="glass rounded-xl p-3 text-center"><div className="font-mono text-sm font-semibold text-warn truncate">Kubernetes</div><div className="text-[10px] text-mute mt-0.5">Next Milestone</div></div>
          </div>
        </div>
      )}
    </Card>
  );
}

function HeroSkillRow({ skill, active, delayMs }) {
  const value = useCountUp(skill.score, 900, active);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-36 shrink-0 truncate">{skill.name}</span>
      <div className="flex-1"><ScoreBar score={active ? value : 0} showValue={false} size="sm" /></div>
      <span className="font-mono text-xs text-mute w-9 text-right">{active ? value : 0}%</span>
      <Badge tone={skill.tone} className="!py-0.5 hidden md:inline-flex">{skill.status}</Badge>
    </div>
  );
}

function DashboardPreviewStrip() {
  return (
    <Card className="p-5 md:p-6 mt-5 fade-up" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-medium">AI Career Intelligence — Target Role</span>
        <Badge tone="mute"><Icon name="cloud" size={11} /> Cloud Engineer</Badge>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1"><span className="text-xs text-mute">Skill Confidence</span><span className="font-mono text-xs">82%</span></div>
          <ScoreBar score={82} showValue={false} size="sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1"><span className="text-xs text-mute">GitHub Evidence</span><span className="font-mono text-xs">74%</span></div>
          <ScoreBar score={74} showValue={false} size="sm" />
        </div>
      </div>
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div>
          <div className="text-[10px] text-warn uppercase tracking-wider font-mono mb-0.5">Critical gap</div>
          <div className="text-sm font-medium">Kubernetes</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-cyan uppercase tracking-wider font-mono mb-0.5">Next best action</div>
          <div className="text-sm font-medium">Build CloudDeploy</div>
        </div>
      </div>
    </Card>
  );
}

const FLOW_STEPS = [
  { label: "Assess", icon: "target" },
  { label: "Analyze", icon: "sparkles" },
  { label: "Learn", icon: "file-text" },
  { label: "Build", icon: "layers" },
  { label: "Prove", icon: "github" },
  { label: "Verify", icon: "check" },
  { label: "Improve", icon: "trending-up" },
];

function LoopViz() {
  return (
    <div className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto pb-2">
      {FLOW_STEPS.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex flex-col items-center gap-2 shrink-0 w-16 md:w-20">
            <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl glass flex items-center justify-center ${i === FLOW_STEPS.length - 1 ? "node-pulse text-cyan shadow-cyanglow" : "text-indigo"}`}>
              <Icon name={s.icon} size={19} />
            </div>
            <span className="text-[10px] md:text-xs text-mute text-center">{s.label}</span>
          </div>
          {i < FLOW_STEPS.length - 1 && <div className="h-px flex-1 min-w-[10px] bg-gradient-to-r from-indigo/40 to-cyan/40 mb-6" />}
        </React.Fragment>
      ))}
    </div>
  );
}

const CAPABILITIES = [
  { icon: "target", title: "Career Digital Twin", desc: "A living model of your technical capability that evolves with your learning and experience." },
  { icon: "shield", title: "Evidence-Based Verification", desc: "Every skill score is backed by real evidence — resume, GitHub, projects, assessments and interviews." },
  { icon: "github", title: "GitHub Analysis", desc: "Deep analysis of your repositories, activity, code quality and the technologies actually used." },
  { icon: "file-text", title: "Resume Intelligence", desc: "Extracts skills, projects and achievements, then compares them against your target role." },
  { icon: "briefcase", title: "Job Matching", desc: "Match any job description against your profile and know exactly where you stand." },
  { icon: "brain-circuit", title: "AI Assessment", desc: "Targeted technical assessments that adapt to your weak areas, not a generic quiz." },
  { icon: "message-circle", title: "AI Interview", desc: "Practice technical, behavioral and situational rounds tailored to your actual profile." },
  { icon: "layers", title: "Proof-of-Skill Projects", desc: "Get scoped, practical projects designed to close a specific gap and prove your skill." },
  { icon: "git-branch", title: "Personalized Roadmap", desc: "Step-by-step milestones customized to your goals, gaps and timeline." },
];

function CapabilityCard({ c }) {
  const [hover, setHover] = useState(false);
  return (
    <Card
      className={`p-5 transition-all duration-200 cursor-default ${hover ? "border-indigo/50 -translate-y-1 shadow-glow" : ""}`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className={`w-11 h-11 rounded-xl bg-indigo/10 text-indigo flex items-center justify-center mb-4 transition-transform duration-200 ${hover ? "scale-110 bg-indigo/20" : ""}`}>
        <Icon name={c.icon} size={20} />
      </div>
      <h3 className="font-display font-medium mb-1.5">{c.title}</h3>
      <p className="text-sm text-mute leading-relaxed mb-2">{c.desc}</p>
      <span className={`text-xs text-cyan inline-flex items-center gap-1 transition-opacity ${hover ? "opacity-100" : "opacity-0"}`}>Explore <Icon name="arrow-right" size={12} /></span>
    </Card>
  );
}

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Career Digital Twin", "GitHub Analyzer", "Resume Intelligence", "AI Assessment"] },
  { title: "Resources", links: ["How It Works", "Career Paths", "Roadmap"] },
  { title: "Company", links: ["About", "Contact", "Privacy", "Terms"] },
];

function Landing({ onGetStarted, onLogin }) {
  const [refCareers, refHow, refCap, refLoop] = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const scrollTo = (key) => {
    const map = { capabilities: refCap, how: refHow, careers: refCareers, loop: refLoop };
    map[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <NavBar onGetStarted={onGetStarted} onLogin={onLogin} onNav={scrollTo} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <LandingBackground />
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-16 md:pt-20 md:pb-24 relative">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-start">
            <div className="fade-up max-w-xl">
              <Badge tone="cyan" className="mb-6"><Icon name="sparkles" size={12} /> AI-powered career intelligence</Badge>
              <h1 className="font-display text-4xl sm:text-5xl md:text-[3.4rem] font-semibold leading-[1.08] tracking-tight">
                Don't Just Claim Your Skills.<br /><span className="text-gradient">Prove Them.</span>
              </h1>
              <p className="text-mute text-lg mt-6 leading-relaxed">
                SkillPilot AI analyzes your skills, resume, GitHub projects and technical performance to build an evidence-based Career Digital Twin — then tells you exactly what to do next.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-9">
                <Button size="lg" onClick={onGetStarted} iconRight="arrow-right">Build My Career Twin</Button>
                <Button size="lg" variant="secondary" onClick={() => scrollTo('how')} icon="play">See How It Works</Button>
              </div>

              <div className="mt-12">
                <div className="text-xs text-mute mb-4">Built for students, developers &amp; aspiring engineers — powered by</div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-mute/80">
                  {["GitHub", "Python", "React", "MySQL", "Gemini", "AWS"].map(t => (
                    <span key={t} className="text-sm font-display tracking-wide">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full">
              <HeroTwinPanel />
              <DashboardPreviewStrip />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" ref={refCap} className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal><SectionTitle eyebrow="Powerful capabilities" title="Everything you need to build a winning career" sub="One platform, end-to-end career intelligence — every feature exists to help you prove, improve, or understand your readiness." /></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((c, i) => <Reveal key={c.title} delay={Math.min(i, 5) * 60}><CapabilityCard c={c} /></Reveal>)}
        </div>
      </section>

      {/* Signature loop */}
      <section id="loop" ref={refLoop} className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal><SectionTitle eyebrow="The SkillPilot loop" title="A continuous loop, not a one-time score" sub="Assess → Analyze → Learn → Build → Prove → Verify → Improve — then it starts again with a stronger twin." /></Reveal>
        <Reveal delay={100}><Card className="p-6 md:p-10"><LoopViz /></Card></Reveal>
      </section>

      {/* How it works */}
      <section id="how" ref={refHow} className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal><SectionTitle eyebrow="How it works" title="From claim to proof in three moves" /></Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "01", t: "Assess & Analyze", d: "Connect GitHub, upload your resume and complete an AI assessment. SkillPilot reads your real evidence — not just what you claim." },
            { n: "02", t: "Understand Your Gaps", d: "Discover which skills are supported by strong evidence and which require improvement, down to the individual evidence item." },
            { n: "03", t: "Build & Reassess", d: "Complete proof-of-skill projects and continuously improve your Career Digital Twin." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <Card className="p-6 h-full">
                <div className="font-mono text-cyan text-sm mb-3">{s.n}</div>
                <h3 className="font-display text-lg font-medium mb-2">{s.t}</h3>
                <p className="text-mute text-sm leading-relaxed">{s.d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Careers teaser */}
      <section id="careers" ref={refCareers} className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal><SectionTitle eyebrow="Target careers" title="Pick where you're headed" sub="SkillPilot builds a different skill graph, roadmap and assessment for each career." /></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAREERS.filter(c => FEATURED_CAREER_IDS.includes(c.id)).map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i, 5) * 60}>
              <button onClick={onGetStarted} className="text-left w-full p-5 rounded-2xl glass border border-line hover:border-cyan/40 hover:-translate-y-0.5 hover:shadow-cyanglow transition-all duration-200 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                    <Icon name={c.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-medium">{c.name}</h3>
                    <p className="text-xs text-mute mt-1 leading-relaxed">{c.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.technologies.slice(0, 4).map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-mute">{t}</span>)}
                </div>
                <span className="text-xs text-cyan inline-flex items-center gap-1 mt-auto pt-1">Explore Career <Icon name="arrow-right" size={12} /></span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal>
          <Card className="p-10 md:p-16 text-center relative overflow-hidden" glow>
            <div className="absolute inset-0 grid-fade opacity-60 pointer-events-none" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">Ready to turn your skills into proof?</h2>
              <p className="text-mute text-lg max-w-xl mx-auto mb-8">Build your Career Digital Twin and discover exactly what you need to do next.</p>
              <Button size="lg" onClick={onGetStarted} iconRight="arrow-right">Build My Career Twin</Button>
            </div>
          </Card>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo to-cyan flex items-center justify-center"><Icon name="target" size={14} className="text-white" /></div>
                <span className="font-display font-semibold">SkillPilot AI</span>
              </div>
              <p className="text-sm text-mute">Prove your skills. Build your career.</p>
            </div>
            {FOOTER_COLUMNS.map(col => (
              <div key={col.title}>
                <div className="text-xs font-mono uppercase tracking-wider text-mute mb-3">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-ink/80 hover:text-cyan transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mute">
            <span>© 2026 SkillPilot AI</span>
            <span>Demo build · scores are illustrative, not an employment guarantee</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
