// ============================================================================
// Target Career — Career Role Explorer
//   • CareerSelectPage : full explorer (search, filters, categories, details, selection, graph,
//                        readiness gap analysis and roadmap preview)
//   • CareerGrid       : compact searchable picker used by onboarding Step 4 (same props as before)
// All data comes from careerCatalog.js — nothing here is hard-coded per career.
// ============================================================================

const TONE_HEX = { good: "#22C55E", warn: "#F59E0B", cyan: "#06B6D4", bad: "#F43F5E", mute: "#64748B", indigo: "#6366F1" };

function categoryOf(career) { return CATEGORY_BY_ID[career.category]; }

function CareerCard({ career, isPrimary, isSecondary, match, onView, onSelect }) {
  const cat = categoryOf(career);
  return (
    <div className={`group relative p-5 rounded-2xl border glass flex flex-col transition-all duration-200 hover:border-cyan/50 ${isPrimary ? "border-cyan shadow-cyanglow" : isSecondary ? "border-indigo/50" : "border-line"}`}
      data-career-card={career.id}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center"><Icon name={career.icon} size={20} /></div>
        <div className="flex items-center gap-1.5">
          {match > 0 && <Badge tone="good">{match}% match</Badge>}
          {isPrimary && <span className="w-6 h-6 rounded-full bg-cyan text-navy flex items-center justify-center" title="Primary target"><Icon name="check" size={13} strokeWidth={3} /></span>}
          {isSecondary && <Badge tone="indigo">Interest</Badge>}
        </div>
      </div>
      <h3 className="font-display font-medium text-base mb-0.5">{career.name}</h3>
      {cat && <div className="text-[11px] text-cyan/80 font-mono mb-2">{cat.name}</div>}
      <p className="text-xs text-mute mb-3 leading-relaxed line-clamp-3 flex-1">{career.description}</p>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-mute font-mono">{career.skills.length} core skills</span>
        <span className="text-[11px] text-mute">Level: <span className="text-ink/80">your choice</span></span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {career.technologies.slice(0, 4).map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-mute">{t}</span>)}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <Button size="sm" variant="secondary" onClick={() => onView(career.id)} aria-label={`View details for ${career.name}`}>View Details</Button>
        <Button size="sm" variant={isPrimary ? "ghost" : "primary"} onClick={() => onSelect(career.id)} disabled={isPrimary}>{isPrimary ? "Selected" : "Select Career"}</Button>
      </div>
    </div>
  );
}

// ---------- Skill dependency graph (layered, generated from the career's own skills) ----------
function SkillGraph({ career, statusOf }) {
  const g = useMemo(() => careerGraph(career), [career.id]);
  const W = 156, H = 40, GX = 56, GY = 14, PAD = 8;
  const pos = {};
  let maxRows = 0;
  g.columns.forEach((col, ci) => {
    const sorted = [...col].sort((a, b) => b.weight - a.weight);
    maxRows = Math.max(maxRows, sorted.length);
    sorted.forEach((s, ri) => { pos[s.id] = { x: PAD + ci * (W + GX), y: PAD + ri * (H + GY) }; });
  });
  const width = PAD * 2 + g.columns.length * W + (g.columns.length - 1) * GX;
  const height = PAD * 2 + maxRows * H + (maxRows - 1) * GY;
  const trunc = (t) => (t.length > 21 ? t.slice(0, 20) + "…" : t);
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <svg width={width} height={height} role="img" aria-label={`${career.name} skill dependency graph`} data-testid="skill-graph" style={{ minWidth: width }}>
          <defs><marker id={"arr-" + career.id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="rgba(148,163,184,0.7)" /></marker></defs>
          {g.edges.map((e, i) => {
            const a = pos[e.from], b = pos[e.to]; if (!a || !b) return null;
            const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
            return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="1.4" markerEnd={`url(#arr-${career.id})`} />;
          })}
          {career.skills.map(s => {
            const p = pos[s.id]; if (!p) return null;
            const st = statusOf ? statusOf(s) : { tone: "indigo", label: "" };
            const hex = TONE_HEX[st.tone] || TONE_HEX.indigo;
            return (
              <g key={s.id} transform={`translate(${p.x},${p.y})`} data-graph-node={s.id}>
                <title>{s.name}{st.label ? ` — ${st.label}` : ""}</title>
                <rect width={W} height={H} rx="10" fill="#151B2E" stroke={hex} strokeOpacity="0.7" strokeWidth="1.3" />
                <rect width="4" height={H} rx="2" fill={hex} />
                <text x="14" y={H / 2 + 4} fill="#F8FAFC" fontSize="12" fontFamily="Inter, sans-serif">{trunc(s.name)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs" data-testid="learning-path">
        <span className="text-mute mr-1">Learning path:</span>
        {g.order.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-ink/90">{s.name}</span>
            {i < g.order.length - 1 && <Icon name="arrow-right" size={11} className="text-mute" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function GraphLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-mute mb-3">
      {items.map(i => <span key={i.label} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: TONE_HEX[i.tone] }} />{i.label}</span>)}
    </div>
  );
}

// ---------- Career details ----------
function CareerDetails({ career, ctx, profile, isPrimary, isSecondary, onSelect, onToggleSecondary, onOpen, onClose }) {
  const cat = categoryOf(career);
  const groups = careerSkillGroups(career);
  const match = roleMatch(career, ctx);
  const related = (career.relatedIds || []).map(id => CAREER_BY_ID[id]).filter(Boolean);
  const claimed = (s) => isSkillClaimed(s, ctx);
  const statusOf = (s) => claimed(s) ? { tone: "cyan", label: "You listed this" } : { tone: "mute", label: "Not yet" };
  const skillChip = (s) => (
    <span key={s.id} className={`text-xs px-2.5 py-1 rounded-full border ${s.core ? "bg-indigo/15 border-indigo/40 text-ink" : "border-dashed border-line text-mute"} ${claimed(s) ? "!border-cyan/60" : ""}`}>
      {claimed(s) && <Icon name="check" size={10} className="inline mr-1 text-cyan" strokeWidth={3} />}{s.name}
    </span>
  );
  return (
    <div data-testid="career-details">
      <div className="p-6 border-b border-line sticky top-0 glass-strong z-10 rounded-t-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center shrink-0"><Icon name={career.icon} size={22} /></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold">{career.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {cat && <Badge tone="cyan">{cat.name}</Badge>}
              <Badge tone="mute">{career.skills.length} core · {(career.optionalSkills || []).length} optional skills</Badge>
              {match > 0 && <Badge tone="good">{match}% of core skills you listed</Badge>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close details" className="text-mute hover:text-ink"><Icon name="x" size={18} /></button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" onClick={() => onSelect(career.id)} disabled={isPrimary}>{isPrimary ? "✓ Primary target" : "Select as primary career"}</Button>
          <Button size="sm" variant="secondary" onClick={() => onToggleSecondary(career.id)} disabled={isPrimary}>{isSecondary ? "Remove from interests" : "Add as secondary interest"}</Button>
        </div>
      </div>

      <div className="p-6 space-y-7">
        <section>
          <h4 className="font-display font-medium mb-2">Role overview</h4>
          <p className="text-sm text-ink/80 leading-relaxed">{career.description}</p>
        </section>

        <section>
          <h4 className="font-display font-medium mb-2">Responsibilities</h4>
          <ul className="space-y-1.5">
            {career.responsibilities.map(r => <li key={r} className="text-sm text-ink/80 flex gap-2"><Icon name="check" size={14} className="text-good mt-0.5 shrink-0" />{r}</li>)}
          </ul>
        </section>

        <section>
          <h4 className="font-display font-medium mb-3">Skills</h4>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <div className="text-xs font-mono text-indigo mb-2">CORE · {career.skills.length}</div>
              <div className="flex flex-wrap gap-1.5">{career.skills.map(s => skillChip({ ...s, core: true }))}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-mute mb-2">OPTIONAL · {(career.optionalSkills || []).length}</div>
              <div className="flex flex-wrap gap-1.5">
                {(career.optionalSkills || []).length ? career.optionalSkills.map(s => skillChip({ ...s, core: false })) : <span className="text-xs text-mute">None listed</span>}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="font-display font-medium mb-3">Technology breakdown</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {groups.map(g => (
              <div key={g.label} className="glass rounded-xl p-3.5 border border-line">
                <div className="text-xs text-mute mb-2">{g.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(s => <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full ${s.core ? "bg-indigo/15 text-ink" : "bg-white/5 text-mute"}`}>{s.name}</span>)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-mute mt-2">Solid chips are core skills; muted chips are optional.</p>
        </section>

        <section>
          <h4 className="font-display font-medium mb-1">Skill dependency graph</h4>
          <p className="text-xs text-mute mb-3">Generated from this role's own skills — arrows show what to learn first.</p>
          <GraphLegend items={[{ tone: "cyan", label: "You listed this" }, { tone: "mute", label: "Not yet" }]} />
          <SkillGraph career={career} statusOf={statusOf} />
        </section>

        <section>
          <h4 className="font-display font-medium mb-2">Recommended certifications</h4>
          <ul className="space-y-1.5">
            {(career.certifications || []).map(c => <li key={c} className="text-sm text-ink/80 flex gap-2"><Icon name="award" size={14} className="text-warn mt-0.5 shrink-0" />{c}</li>)}
          </ul>
        </section>

        <section>
          <h4 className="font-display font-medium mb-2">Example real-world projects</h4>
          <ul className="space-y-1.5">
            {(career.exampleProjects || []).map(p => <li key={p} className="text-sm text-ink/80 flex gap-2"><Icon name="layers" size={14} className="text-cyan mt-0.5 shrink-0" />{p}</li>)}
          </ul>
        </section>

        {related.length > 0 && (
          <section>
            <h4 className="font-display font-medium mb-2">Related career opportunities</h4>
            <div className="flex flex-wrap gap-2">
              {related.map(r => <button key={r.id} onClick={() => onOpen(r.id)} className="chip px-3 py-1.5 rounded-full text-sm text-ink/90 hover:border-cyan/50 transition-colors">{r.name}</button>)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- Primary-career panel: graph + readiness gap analysis + roadmap preview ----------
function CareerPlan({ career, skillState, readiness, profile, setView }) {
  const level = LEVEL_BY_ID[profile.careerLevel || defaultCareerLevel(profile.experience)];
  const buckets = { known: [], partial: [], improve: [], missing: [] };
  career.skills.forEach(s => { buckets[skillStatus(skillState[s.id]?.score ?? 0).id].push(s); });
  const statusOf = (s) => skillStatus(skillState[s.id]?.score ?? 0);
  const g = careerGraph(career);
  const phaseNames = ["Foundations", "Core skills", "Applied & advanced"];
  const phases = [0, 1, 2].map(i => {
    const skills = g.order.filter(s => (i < 2 ? g.depth[s.id] === i : g.depth[s.id] >= 2));
    return { name: phaseNames[i], skills, open: skills.filter(s => (skillState[s.id]?.score ?? 0) < level.target) };
  }).filter(p => p.skills.length);
  const capstone = projectsForCareer(career).find(p => p.careerId === career.id) || projectsForCareer(career)[0];
  const meta = [
    { id: "known", label: "Strong skills", tone: "good", hint: "Verified by evidence (70+)" },
    { id: "partial", label: "Partially known", tone: "warn", hint: "Some evidence (40–69)" },
    { id: "improve", label: "Needs improvement", tone: "cyan", hint: "Claimed or weak evidence" },
    { id: "missing", label: "Missing", tone: "bad", hint: "No skills or evidence yet" },
  ];
  return (
    <div className="space-y-6" data-testid="career-plan">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo/10 text-indigo flex items-center justify-center"><Icon name={career.icon} size={18} /></div>
          <div>
            <h3 className="font-display font-medium">{career.name} — skill dependency graph</h3>
            <p className="text-xs text-mute">Built from this role's required skills. Colour shows your current evidence.</p>
          </div>
        </div>
        <div className="mt-4">
          <GraphLegend items={[{ tone: "good", label: "Strong" }, { tone: "warn", label: "Partial" }, { tone: "cyan", label: "Needs evidence" }, { tone: "bad", label: "Missing" }]} />
          <SkillGraph career={career} statusOf={statusOf} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2" data-testid="readiness-card">
          <h3 className="font-display font-medium mb-1">Career readiness</h3>
          <p className="text-xs text-mute mb-4">Based on verified evidence — resume, GitHub, projects, assessments and interviews — not on how many skills you ticked.</p>
          <div className="flex items-center gap-5">
            <ScoreRing score={readiness} label="Ready" />
            <div className="text-sm text-mute">
              <div>Target level: <span className="text-ink">{level.label}</span></div>
              <div className="text-xs mt-1">Skills count as complete at <span className="text-ink font-mono">{level.target}/100</span> confidence.</div>
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {meta.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm" data-bucket={m.id}>
                <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: TONE_HEX[m.tone] }} />{m.label}<span className="text-[11px] text-mute hidden sm:inline">· {m.hint}</span></span>
                <span className="font-mono">{buckets[m.id].length}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3" data-testid="gap-card">
          <h3 className="font-display font-medium mb-4">Skill gap analysis</h3>
          <div className="space-y-4">
            {meta.map(m => buckets[m.id].length > 0 && (
              <div key={m.id}>
                <div className="text-xs font-mono mb-1.5" style={{ color: TONE_HEX[m.tone] }}>{m.label.toUpperCase()} · {buckets[m.id].length}</div>
                <div className="flex flex-wrap gap-1.5">
                  {buckets[m.id].map(s => <span key={s.id} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: TONE_HEX[m.tone] + "66", background: TONE_HEX[m.tone] + "14" }}>{s.name} <span className="text-mute font-mono">{skillState[s.id]?.score ?? 0}</span></span>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6" data-testid="roadmap-preview">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-display font-medium">Your personalised roadmap</h3>
            <p className="text-xs text-mute">Phases follow the dependency graph; each skill is checked against your {level.label.toLowerCase()} target of {level.target}/100.</p>
          </div>
          <Button size="sm" onClick={() => setView("roadmap")} iconRight="arrow-right">Open full roadmap</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {phases.map((p, i) => (
            <div key={p.name} className="glass rounded-xl p-4 border border-line">
              <div className="text-xs font-mono text-cyan mb-1">PHASE {i + 1}</div>
              <div className="font-medium mb-1">{p.name}</div>
              <div className="text-xs text-mute mb-2">{p.open.length === 0 ? "All skills at target 🎉" : `${p.open.length} of ${p.skills.length} still to reach target`}</div>
              <div className="flex flex-wrap gap-1.5">{p.skills.map(s => <span key={s.id} className={`text-[11px] px-2 py-0.5 rounded-full ${p.open.includes(s) ? "bg-white/5 text-mute" : "bg-good/15 text-good"}`}>{s.name}</span>)}</div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <button onClick={() => setView("assessment")} className="text-left glass rounded-xl p-4 border border-line hover:border-cyan/40 transition-colors">
            <div className="text-xs font-mono text-indigo mb-1">ASSESSMENTS</div>
            <div className="text-sm">{buckets.missing.length + buckets.improve.length + buckets.partial.length} skills can be verified with a quick assessment →</div>
          </button>
          {capstone && (
            <button onClick={() => setView("projects")} className="text-left glass rounded-xl p-4 border border-line hover:border-cyan/40 transition-colors">
              <div className="text-xs font-mono text-indigo mb-1">PRACTICAL PROJECT</div>
              <div className="text-sm">{capstone.name}: {capstone.description}</div>
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------- Explorer page ----------
const PAGE_SIZE = 24;
const QUICK_FILTERS = [
  { id: "all", label: "All careers", icon: "grid" },
  { id: "popular", label: "Popular", icon: "star" },
  { id: "recommended", label: "Recommended for you", icon: "sparkles" },
  { id: "recent", label: "Recently viewed", icon: "history" },
  { id: "interests", label: "My interests", icon: "bookmark" },
];

function CareerSelectPage({ profile, setProfile, onChangeCareer, skillState, readiness, setView }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const current = CAREER_BY_ID[profile.careerId];
  const [open, setOpen] = useState(() => { const o = {}; o[current ? current.category : "software"] = true; return o; });
  const [detailId, setDetailId] = useState(null);

  const secondary = profile.secondaryCareers || [];
  const recentIds = profile.recentCareers || [];
  const levelId = profile.careerLevel || defaultCareerLevel(profile.experience);
  const ctx = useMemo(() => claimContext(profile.currentSkills), [profile.currentSkills]);
  const recs = useMemo(() => recommendCareers(ctx, 6, [profile.careerId]), [ctx, profile.careerId]);
  const matchOf = (c) => roleMatch(c, ctx);

  const openDetails = (id) => {
    setDetailId(id);
    setProfile(p => ({ ...p, recentCareers: [id, ...(p.recentCareers || []).filter(x => x !== id)].slice(0, 8) }));
  };
  const toggleSecondary = (id) => setProfile(p => {
    const list = p.secondaryCareers || [];
    if (id === p.careerId) return p;
    return { ...p, secondaryCareers: list.includes(id) ? list.filter(x => x !== id) : [...list, id].slice(0, 5) };
  });
  const select = (id) => {
    onChangeCareer(id);
    setProfile(p => ({ ...p, secondaryCareers: (p.secondaryCareers || []).filter(x => x !== id) }));
  };
  const setLevel = (id) => setProfile(p => ({ ...p, careerLevel: id }));

  const searching = query.trim() !== "" || filter !== "all" || category !== "all";
  const results = useMemo(() => {
    let ids;
    if (filter === "recent") ids = recentIds;
    else if (filter === "interests") ids = secondary;
    let list = searchCareers(query, { category, ids });
    if (filter === "popular") list = list.filter(r => r.career.popular);
    if (filter === "recommended") {
      const rank = {}; recommendCareers(ctx, 200).forEach((r, i) => { rank[r.career.id] = i; });
      list = list.filter(r => rank[r.career.id] !== undefined);
      if (!query.trim()) list = list.sort((a, b) => rank[a.career.id] - rank[b.career.id]);
    }
    if (filter === "recent" && !query.trim()) list = list.sort((a, b) => recentIds.indexOf(a.career.id) - recentIds.indexOf(b.career.id));
    return list.map(r => r.career);
  }, [query, filter, category, recentIds.join(), secondary.join(), ctx]);

  const reset = () => { setQuery(""); setFilter("all"); setCategory("all"); setLimit(PAGE_SIZE); };
  const card = (c, m) => <CareerCard key={c.id} career={c} isPrimary={c.id === profile.careerId} isSecondary={secondary.includes(c.id)} match={m ?? matchOf(c)} onView={openDetails} onSelect={select} />;
  const detail = detailId ? CAREER_BY_ID[detailId] : null;
  const allOpen = CAREER_CATEGORIES.every(c => open[c.id]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <SectionTitle eyebrow="Target career" title="Explore technology careers"
        sub={`Browse ${CAREERS.length} roles across ${CAREER_CATEGORIES.length} categories. Your Career Digital Twin, roadmap and assessments are built around the career you select — change it any time.`} />

      {/* Current selection */}
      {current ? (
        <Card className="p-5 mb-6" glow data-testid="selection-card">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center shrink-0"><Icon name={current.icon} size={22} /></div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs font-mono text-cyan mb-0.5">PRIMARY TARGET CAREER</div>
              <div className="font-display text-lg font-semibold">{current.name}</div>
              <div className="text-xs text-mute">{categoryOf(current)?.name} · {current.skills.length} core skills</div>
            </div>
            <div>
              <div className="text-xs text-mute mb-1.5">Career level you're aiming for</div>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Career level">
                {ROLE_LEVELS.map(l => (
                  <button key={l.id} role="radio" aria-checked={levelId === l.id} onClick={() => setLevel(l.id)} data-level={l.id} title={`${l.desc} (${l.years})`}
                    className={`chip px-3 py-1.5 rounded-full text-sm transition-colors ${levelId === l.id ? "!bg-indigo/20 !border-indigo/60 text-white" : "text-mute hover:text-ink"}`}>{l.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-xs text-mute mb-2">Secondary interests {secondary.length ? `· ${secondary.length}/5` : ""}</div>
            {secondary.length === 0 ? (
              <p className="text-xs text-mute">None yet — open any career and choose “Add as secondary interest” to keep related options (e.g. SRE or Platform Engineer for a Cloud Engineer).</p>
            ) : (
              <div className="flex flex-wrap gap-2" data-testid="secondary-list">
                {secondary.map(id => CAREER_BY_ID[id] && (
                  <span key={id} className="skill-pop inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-sm bg-indigo/20 border border-indigo/50">
                    <button onClick={() => openDetails(id)} className="hover:underline">{CAREER_BY_ID[id].name}</button>
                    <button onClick={() => toggleSecondary(id)} aria-label={`Remove ${CAREER_BY_ID[id].name}`} data-remove-secondary={id} className="w-5 h-5 rounded-full inline-flex items-center justify-center text-mute hover:text-white hover:bg-white/10"><Icon name="x" size={12} strokeWidth={2.5} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5 mb-6 !bg-indigo/5 border-indigo/25 text-sm text-mute">No career selected yet — pick one below to generate your skill graph, readiness score and roadmap.</Card>
      )}

      {current && <div className="mb-10"><CareerPlan career={current} skillState={skillState} readiness={readiness} profile={profile} setView={setView} /></div>}

      {/* Search + filters */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-3 mb-4 bg-navy/90 backdrop-blur">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Search careers" data-testid="career-search"
            placeholder="Search from hundreds of technology career roles..."
            className="w-full bg-panel2 border border-line rounded-xl pl-10 pr-10 py-3 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60 transition-colors" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"><Icon name="x" size={15} /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {QUICK_FILTERS.map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setLimit(PAGE_SIZE); }} data-filter={f.id} aria-pressed={filter === f.id}
              className={`chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${filter === f.id ? "!bg-indigo/20 !border-indigo/60 text-white" : "text-mute hover:text-ink"}`}>
              <Icon name={f.icon} size={13} />{f.label}
            </button>
          ))}
          <select value={category} onChange={e => { setCategory(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Filter by category" data-testid="category-filter"
            className="ml-auto bg-panel2 border border-line rounded-xl px-3 py-1.5 text-sm text-ink">
            <option value="all">All categories</option>
            {CAREER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {searching ? (
        <div data-testid="career-results">
          <div className="flex items-center justify-between mb-4 text-sm text-mute">
            <span><span className="text-ink font-mono">{results.length}</span> career{results.length === 1 ? "" : "s"} found{query.trim() ? <> for “{query.trim()}”</> : null}</span>
            <button onClick={reset} className="text-cyan hover:underline">Clear filters</button>
          </div>
          {results.length === 0 ? (
            <EmptyState icon="search" title="No careers match" sub={filter === "recent" ? "Open any career's details and it will appear here." : filter === "interests" ? "Add secondary interests from a career's details." : "Try a different title, technology or category."} />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{results.slice(0, limit).map(c => card(c))}</div>
              {results.length > limit && <div className="text-center mt-6"><Button variant="secondary" onClick={() => setLimit(l => l + PAGE_SIZE)}>Show more ({results.length - limit} left)</Button></div>}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {recs.length > 0 && (
            <section data-testid="recommended">
              <h3 className="font-display font-medium mb-1 flex items-center gap-2"><Icon name="sparkles" size={16} className="text-cyan" />{Object.keys(ctx.selIds).length ? "Recommended for you" : "Popular careers"}</h3>
              <p className="text-xs text-mute mb-4">{Object.keys(ctx.selIds).length ? "Ranked by how many core skills you already listed in onboarding." : "Add skills in your profile to get personalised recommendations."}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{recs.map(r => card(r.career, r.match))}</div>
            </section>
          )}
          {recentIds.filter(id => CAREER_BY_ID[id]).length > 0 && (
            <section data-testid="recent">
              <h3 className="font-display font-medium mb-4 flex items-center gap-2"><Icon name="history" size={16} className="text-cyan" />Recently viewed</h3>
              <div className="flex flex-wrap gap-2">
                {recentIds.filter(id => CAREER_BY_ID[id]).slice(0, 6).map(id => <button key={id} onClick={() => openDetails(id)} className="chip px-3 py-1.5 rounded-full text-sm hover:border-cyan/50 transition-colors">{CAREER_BY_ID[id].name}</button>)}
              </div>
            </section>
          )}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-medium">Browse by category</h3>
              <button className="text-sm text-cyan hover:underline" onClick={() => { const o = {}; if (!allOpen) CAREER_CATEGORIES.forEach(c => { o[c.id] = true; }); setOpen(o); }}>{allOpen ? "Collapse all" : "Expand all"}</button>
            </div>
            <div className="space-y-3">
              {CAREER_CATEGORIES.map(cat => {
                const list = CAREERS.filter(c => c.category === cat.id);
                const isOpen = !!open[cat.id];
                return (
                  <div key={cat.id} className={`glass rounded-2xl border transition-colors ${isOpen ? "border-indigo/30" : "border-line"}`}>
                    <button type="button" aria-expanded={isOpen} data-career-cat={cat.id} onClick={() => setOpen(o => ({ ...o, [cat.id]: !o[cat.id] }))}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className="w-9 h-9 rounded-lg bg-indigo/15 text-indigo inline-flex items-center justify-center shrink-0"><Icon name={cat.icon} size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display font-medium truncate">{cat.name}</span>
                        <span className="block text-xs text-mute truncate">{cat.blurb}</span>
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-mute shrink-0">{list.length}</span>
                      <Icon name="chevron-down" size={16} className={`text-mute shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(c => card(c))}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetailId(null)} wide>
        {detail && <CareerDetails career={detail} ctx={ctx} profile={profile}
          isPrimary={detail.id === profile.careerId} isSecondary={secondary.includes(detail.id)}
          onSelect={select} onToggleSecondary={toggleSecondary} onOpen={openDetails} onClose={() => setDetailId(null)} />}
      </Modal>
    </div>
  );
}

// ---------- Compact picker used by onboarding Step 4 ----------
function CareerGrid({ selectedId, onSelect }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(12);
  const selected = CAREER_BY_ID[selectedId];
  const results = useMemo(() => {
    const list = searchCareers(query, { category }).map(r => r.career);
    return query.trim() || category !== "all" ? list : [...list].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }, [query, category]);
  return (
    <div data-testid="career-picker">
      {selected && (
        <div className="glass rounded-xl border border-cyan/50 shadow-cyanglow p-3.5 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center"><Icon name={selected.icon} size={16} /></div>
          <div className="min-w-0 flex-1"><div className="text-[11px] text-cyan font-mono">SELECTED</div><div className="font-medium truncate">{selected.name}</div></div>
          <Icon name="check" size={16} className="text-cyan" />
        </div>
      )}
      <div className="relative mb-3">
        <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
        <input value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} aria-label="Search careers"
          placeholder="Search from hundreds of technology career roles..."
          className="w-full bg-panel2 border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60 transition-colors" />
      </div>
      <select value={category} onChange={e => { setCategory(e.target.value); setLimit(12); }} aria-label="Filter by category"
        className="w-full bg-panel2 border border-line rounded-xl px-3 py-2 text-sm text-ink mb-4">
        <option value="all">All categories ({CAREERS.length} careers)</option>
        {CAREER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {results.length === 0 && <p className="text-sm text-mute py-6 text-center">No careers match “{query}”.</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {results.slice(0, limit).map(c => (
          <button key={c.id} type="button" onClick={() => onSelect(c.id)} data-career-card={c.id}
            className={`text-left p-4 rounded-xl border glass transition-all hover:border-cyan/50 ${selectedId === c.id ? "border-cyan shadow-cyanglow" : "border-line"}`}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-8 h-8 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center shrink-0"><Icon name={c.icon} size={15} /></span>
              <span className="font-medium text-sm leading-tight">{c.name}</span>
            </div>
            <div className="text-[11px] text-cyan/80 font-mono mb-1">{categoryOf(c)?.name}</div>
            <p className="text-xs text-mute line-clamp-2">{c.description}</p>
          </button>
        ))}
      </div>
      {results.length > limit && <div className="text-center mt-4"><Button size="sm" variant="secondary" onClick={() => setLimit(l => l + 12)}>Show more ({results.length - limit})</Button></div>}
    </div>
  );
}
