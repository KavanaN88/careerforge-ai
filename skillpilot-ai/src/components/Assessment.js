// ============================================================================
// AI ASSESSMENT — dynamic, career-based, 3 levels for every skill.
// Props: career, skillState, assessmentResults (0-10 legacy map), assessmentHistory[],
//        onAttemptComplete({ entry, score10, serverState })
// Components: CareerAssessmentOverview, DifficultySelector, SkillAssessmentCard, AssessmentInstructions,
// AssessmentTimer, QuestionRenderer, AssessmentNavigation, AssessmentResults, PerformanceAnalytics,
// AssessmentHistory, AssessmentSettings. Backend mode grades on the server; demo mode grades locally.
// ============================================================================
const LEVEL_STYLE = {
  basic:        { text: "text-good",   border: "border-good/40",   bg: "bg-good/10",   ring: "border-good",   dot: "bg-good",   bar: "#22C55E", tone: "good" },
  intermediate: { text: "text-indigo", border: "border-indigo/40", bg: "bg-indigo/10", ring: "border-indigo", dot: "bg-indigo", bar: "#6366F1", tone: "indigo" },
  advanced:     { text: "text-warn",   border: "border-warn/40",   bg: "bg-warn/10",   ring: "border-warn",   dot: "bg-warn",   bar: "#F59E0B", tone: "warn" },
};
const LEVEL_BY_KEY = {}; ASSESSMENT_LEVELS.forEach(l => { LEVEL_BY_KEY[l.id] = l; });
const DRAFT_KEY = "skillpilot:assessmentDraft";
const CONFIG_KEY = "skillpilot:assessmentConfig";
const fmtClock = (sec) => { sec = Math.max(0, Math.round(sec)); return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; };
const useBackendAssess = () => !!(API.available && API.token);
const loadDraft = () => { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); return d && d.deadline > Date.now() ? d : null; } catch (e) { return null; } };
const saveDraft = (d) => { try { d ? localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) : localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } };
const pctTone = (p) => (p >= 75 ? "good" : p >= 50 ? "warn" : "bad");

function Assessment({ career, skillState, assessmentResults, assessmentHistory, onAttemptComplete }) {
  const history = assessmentHistory || [];
  const [config, setConfig] = useState(() => { try { return normalizeAssessmentConfig(JSON.parse(localStorage.getItem(CONFIG_KEY) || "null")); } catch (e) { return defaultAssessmentConfig(); } });
  const [isAdmin, setIsAdmin] = useState(() => !useBackendAssess());   // demo mode: you own the settings
  const [focusLevel, setFocusLevel] = useState("basic");
  const [phase, setPhase] = useState("home");                           // home | instructions | run | results
  const [target, setTarget] = useState(null);                           // { skillId, level }
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState(() => loadDraft());
  const [query, setQuery] = useState("");
  const submitting = useRef(false);

  // Server-side configuration (backend mode)
  useEffect(() => {
    if (!useBackendAssess()) return;
    API.request("GET", "/api/assessment/config").then(r => { setConfig(normalizeAssessmentConfig(r.config)); setIsAdmin(!!r.isAdmin); }).catch(() => {});
  }, []);

  const skillObj = (id) => career.skills.find(s => s.id === id);
  const recs = useMemo(() => recommendNext(career, history, skillState, config), [career, history, skillState, config]);
  const summaries = useMemo(() => { const m = {}; career.skills.forEach(s => { m[s.id] = skillLevelSummary(history, s.id); }); return m; }, [career, history]);
  const composites = useMemo(() => { const m = {}; career.skills.forEach(s => { m[s.id] = skillComposite(history, s.id); }); return m; }, [career, history]);

  // ---- lifecycle ----
  const openInstructions = (skillId, level) => { setError(""); setTarget({ skillId, level }); setPhase("instructions"); window.scrollTo && window.scrollTo(0, 0); };

  const begin = async () => {
    setBusy(true); setError("");
    const { skillId, level } = target;
    try {
      let sess;
      if (useBackendAssess()) {
        const r = await API.request("POST", "/api/assessment/start", { skillId, level, careerId: career.id });
        sess = { attemptId: r.attemptId, skillId, level, questions: r.questions, limitSec: r.limitSec, settings: r.settings, deadline: Date.now() + r.remainingSec * 1000, server: true, startedAt: Date.now() - (r.limitSec - r.remainingSec) * 1000 };
        setAnswers(r.answers || {});
      } else {
        const exclude = history.filter(h => h.skillId === skillId && h.level === level).slice(-3).flatMap(h => h.questionIds || []);
        const qs = buildAssessment(skillId, level, config, { seed: `${skillId}:${level}:${Date.now()}:${Math.random()}`, exclude });
        if (!qs.length) throw new Error("No questions are available for this skill with the current format settings.");
        const lc = normalizeAssessmentConfig(config).levels[level];
        sess = { attemptId: null, skillId, level, questions: qs, limitSec: lc.minutes * 60, settings: lc, deadline: Date.now() + lc.minutes * 60000, server: false, startedAt: Date.now() };
        setAnswers({});
      }
      setSession(sess); setIdx(0); setResult(null); setPhase("run");
      saveDraft({ ...sess, answers: {}, idx: 0 });
    } catch (e) { setError(e.message || "Could not start the assessment."); }
    setBusy(false);
  };

  const resumeDraft = () => {
    if (!draft) return;
    const { answers: a, idx: i, ...sess } = draft;
    setTarget({ skillId: sess.skillId, level: sess.level }); setSession(sess); setAnswers(a || {}); setIdx(i || 0); setResult(null); setPhase("run"); setDraft(null);
  };
  const discardDraft = () => { saveDraft(null); setDraft(null); };

  // Persist answers instantly to local draft; debounce autosave to the server.
  const saveTimer = useRef(null);
  const setAnswer = (qid, value) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (value === null || (Array.isArray(value) && !value.length)) delete next[qid]; else next[qid] = value;
      saveDraft({ ...session, answers: next, idx });
      if (session && session.server) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => API.request("PUT", `/api/assessment/${session.attemptId}/answers`, { answers: next }).catch(() => {}), 700);
      }
      return next;
    });
  };
  const goTo = (i) => { setIdx(i); if (session) saveDraft({ ...session, answers, idx: i }); };

  const submit = async (auto) => {
    if (submitting.current || !session) return;
    submitting.current = true; setBusy(true); setError("");
    const elapsed = Math.min(session.limitSec, Math.round((Date.now() - session.startedAt) / 1000));
    try {
      let res, entry, score10, serverState = null;
      if (session.server) {
        clearTimeout(saveTimer.current);
        const r = await API.request("POST", `/api/assessment/${session.attemptId}/submit`, { answers, elapsedSec: elapsed });
        res = r.result; entry = r.entry; score10 = r.score10; serverState = { assessmentResults: r.assessmentResults, assessmentHistory: r.assessmentHistory };
        if (!entry) { entry = historyEntry({ id: "srv-" + r.attemptId, skillId: session.skillId, careerId: career.id, level: session.level, limitSec: session.limitSec }, res); }
      } else {
        res = gradeAssessment(session.questions, answers, { passPct: session.settings.passPct, elapsedSec: elapsed });
        entry = historyEntry({ id: "loc-" + Date.now(), skillId: session.skillId, careerId: career.id, level: session.level, limitSec: session.limitSec }, res);
        score10 = compositeToTen(skillComposite([...history, entry], session.skillId));
      }
      const prev = history.filter(h => h.skillId === session.skillId && h.level === session.level).slice(-1)[0] || null;
      saveDraft(null);
      setResult({ ...res, entry, prev, auto: !!auto, skillId: session.skillId, level: session.level, composite: skillComposite([...history, entry].filter((h, i, a) => a.findIndex(x => x.id === h.id) === i), session.skillId) });
      onAttemptComplete({ entry, score10, serverState });
      setPhase("results"); window.scrollTo && window.scrollTo(0, 0);
    } catch (e) { setError(e.message || "Could not submit. Your answers are saved — try again."); }
    submitting.current = false; setBusy(false);
  };

  const backHome = () => { setPhase("home"); setSession(null); setResult(null); setTarget(null); setError(""); setDraft(loadDraft()); };

  // ---- phases ----
  if (phase === "instructions" && target) {
    return <AssessmentInstructions skill={skillObj(target.skillId)} level={target.level} config={config} busy={busy} error={error} onStart={begin} onBack={backHome}
      summary={(summaries[target.skillId] || {})[target.level]} />;
  }
  if (phase === "run" && session) {
    return <AssessmentRunner session={session} skill={skillObj(session.skillId)} answers={answers} idx={idx} busy={busy} error={error}
      onAnswer={setAnswer} onGo={goTo} onSubmit={submit} onExit={backHome} />;
  }
  if (phase === "results" && result) {
    const nextRecs = recommendNext(career, [...history], skillState, config).filter(r => r.skillId !== result.skillId || r.level !== result.level);
    return <AssessmentResults result={result} skill={skillObj(result.skillId)} recs={nextRecs.slice(0, 3)} history={history}
      onRetake={() => openInstructions(result.skillId, result.level)} onStart={openInstructions} onBack={backHome} />;
  }

  const q = query.trim().toLowerCase();
  const skills = career.skills.filter(s => !q || s.name.toLowerCase().includes(q));
  const verified = career.skills.filter(s => (composites[s.id] || 0) > 0).length;
  const avg = career.skills.length ? Math.round(career.skills.reduce((t, s) => t + (composites[s.id] || 0), 0) / career.skills.length) : 0;
  const topRec = recs[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="assessment-home">
      <SectionTitle eyebrow="AI Technical Assessment" title="Prove each skill at three levels"
        sub="Every skill in your target career can be assessed at Basic, Intermediate and Advanced level. Results become verified evidence in your Career Digital Twin."
        right={<Button variant="secondary" size="sm" icon="filter" onClick={() => setShowSettings(true)} data-testid="open-settings">Assessment settings</Button>} />

      {draft && (
        <Card className="p-4 mb-5 !bg-warn/5 border-warn/30 flex flex-wrap items-center gap-3" data-testid="resume-banner">
          <Icon name="clock" size={16} className="text-warn" />
          <span className="text-sm flex-1 min-w-[200px]">You have an unfinished <b>{LEVEL_BY_KEY[draft.level].label}</b> assessment on <b>{(SKILL_LIB[draft.skillId] || {}).name}</b> — {fmtClock((draft.deadline - Date.now()) / 1000)} left. Your answers are saved.</span>
          <Button size="sm" onClick={resumeDraft} data-testid="resume-btn">Resume</Button>
          <Button size="sm" variant="ghost" onClick={discardDraft}>Discard</Button>
        </Card>
      )}

      <CareerAssessmentOverview career={career} verified={verified} avg={avg} history={history} />
      <DifficultySelector config={config} focus={focusLevel} onFocus={setFocusLevel} />

      {topRec && (
        <Card className="p-5 mb-6 !bg-indigo/5 border-indigo/25" data-testid="recommended-next">
          <div className="flex items-center gap-2 mb-1.5 text-indigo text-sm font-medium"><Icon name="sparkles" size={15} /> Recommended next assessment</div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-mute flex-1 min-w-[220px]"><b className="text-ink">{topRec.skillName} — {LEVEL_BY_KEY[topRec.level].label}.</b> {topRec.reason}</p>
            <Button size="sm" iconRight="arrow-right" onClick={() => openInstructions(topRec.skillId, topRec.level)} data-testid="start-recommended">Start now</Button>
          </div>
          {recs.length > 1 && <p className="text-xs text-mute mt-3">Also worth doing: {recs.slice(1, 4).map(r => `${r.skillName} (${LEVEL_BY_KEY[r.level].label})`).join(" · ")}</p>}
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-lg font-medium">Skills for {career.name} <span className="text-mute text-sm font-normal">· {career.skills.length} technical skills</span></h3>
        <div className="relative w-full sm:w-64">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search skills" placeholder="Search skills…"
            className="w-full bg-panel2 border border-line rounded-xl pl-9 pr-3 py-2 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="skill-grid">
        {skills.map(s => <SkillAssessmentCard key={s.id} skill={s} summary={summaries[s.id]} composite={composites[s.id]} config={config} focus={focusLevel}
          recommended={topRec && topRec.skillId === s.id ? topRec.level : null} onStart={openInstructions} />)}
        {skills.length === 0 && <p className="text-sm text-mute col-span-full">No skills match “{query}”.</p>}
      </div>

      <AssessmentHistory history={history} career={career} />

      <Modal open={showSettings} onClose={() => setShowSettings(false)} wide>
        <AssessmentSettings config={config} editable={isAdmin} onClose={() => setShowSettings(false)}
          onSave={async (cfg) => {
            if (useBackendAssess()) { const r = await API.request("PUT", "/api/assessment/config", { config: cfg }); setConfig(normalizeAssessmentConfig(r.config)); }
            else { const c = normalizeAssessmentConfig(cfg); setConfig(c); try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ } }
          }} />
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
function CareerAssessmentOverview({ career, verified, avg, history }) {
  const done = history.filter(h => career.skills.some(s => s.id === h.skillId)).length;
  const tiles = [
    { label: "Technical skills", value: career.skills.length, tone: "text-cyan" },
    { label: "Skills with evidence", value: `${verified}/${career.skills.length}`, tone: "text-good" },
    { label: "Verified proficiency", value: `${avg}%`, tone: "text-indigo" },
    { label: "Attempts completed", value: done, tone: "text-warn" },
  ];
  return (
    <Card className="p-5 md:p-6 mb-5" glow>
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo to-cyan inline-flex items-center justify-center shrink-0"><Icon name="target" size={22} className="text-white" /></div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-mono text-cyan uppercase tracking-wider">Selected career</div>
          <h2 className="font-display text-xl md:text-2xl font-semibold" data-testid="career-name">{career.name}</h2>
          <p className="text-sm text-mute" data-testid="skill-count-line">{career.skills.length} associated technical skills — assessments are generated from this list.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl bg-panel2/60 border border-line px-4 py-3">
            <div className={`font-mono text-xl font-bold ${t.tone}`}>{t.value}</div>
            <div className="text-xs text-mute">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-mute mt-4">Skills you only <i>declare</i> are not treated as verified. Basic-only results count for 40% of a skill's evidence; Intermediate and Advanced unlock the rest.</p>
    </Card>
  );
}

function DifficultySelector({ config, focus, onFocus }) {
  const cfg = normalizeAssessmentConfig(config).levels;
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6" role="radiogroup" aria-label="Assessment difficulty" data-testid="difficulty-selector">
      {ASSESSMENT_LEVELS.map(l => {
        const st = LEVEL_STYLE[l.id], c = cfg[l.id], on = focus === l.id;
        return (
          <button key={l.id} type="button" role="radio" aria-checked={on} onClick={() => onFocus(l.id)} data-level={l.id} disabled={!c.enabled}
            className={`text-left rounded-2xl p-5 border-2 transition-all ${on ? `${st.ring} ${st.bg} shadow-glow` : "border-line bg-panel/60 hover:border-cyan/40"} ${c.enabled ? "" : "opacity-40"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-display font-semibold text-lg ${st.text}`}>{l.label}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
            </div>
            <p className="text-sm text-mute mb-3">{l.desc}</p>
            <div className="flex gap-4 text-xs font-mono text-ink">
              <span>{c.questions} questions</span><span>{c.minutes} min</span><span>pass {c.passPct}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SkillAssessmentCard({ skill, summary, composite, config, focus, recommended, onStart }) {
  const lib = SKILL_LIB[skill.id] || {}; const cfg = normalizeAssessmentConfig(config).levels;
  return (
    <Card className="p-5 flex flex-col" data-skill-card={skill.id}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{skill.name}</div>
          <div className="text-[11px] text-mute font-mono uppercase tracking-wide">{lib.kind ? SKILL_KIND_LABEL_SHORT[lib.kind] : "skill"}</div>
        </div>
        {composite > 0 ? <Badge tone={pctTone(composite)} className="shrink-0">{composite}% verified</Badge> : <Badge tone="mute" className="shrink-0">Not assessed</Badge>}
      </div>
      <div className="space-y-2 mt-3">
        {ASSESSMENT_LEVELS.map(l => {
          const st = LEVEL_STYLE[l.id], s = summary ? summary[l.id] : { attempts: 0 }; const n = poolSize(skill.id, l.id);
          const isRec = recommended === l.id; const isFocus = focus === l.id;
          return (
            <div key={l.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isFocus ? st.border + " " + st.bg : "border-line"} ${isRec ? "ring-1 ring-cyan/60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${st.text}`}>{l.label}{isRec && <span className="ml-1.5 text-[10px] text-cyan">· recommended</span>}</div>
                <div className="text-[11px] text-mute">
                  {s.attempts ? <>{s.passed ? <span className="text-good">✓ Passed</span> : <span className="text-warn">Not passed</span>} · best {s.best}% · last {s.last}% · {s.attempts}×</> : <>Not started · {Math.min(n, cfg[l.id].questions)} questions</>}
                </div>
              </div>
              <button type="button" disabled={!cfg[l.id].enabled || n === 0} onClick={() => onStart(skill.id, l.id)} data-start={`${skill.id}:${l.id}`}
                aria-label={`${s.attempts ? "Retake" : "Start"} ${l.label} assessment for ${skill.name}`}
                className="shrink-0 text-xs font-display font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo to-cyan text-white hover:brightness-110 disabled:opacity-40">
                {s.attempts ? "Retake" : `${l.label} Assessment`.replace(`${l.label} Assessment`, "Start")}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
const SKILL_KIND_LABEL_SHORT = { lang: "Language", fw: "Framework", db: "Database", tool: "Tool", cloud: "Cloud", cs: "Concept" };

// ------------------------------------------------------------------------------------------------
function AssessmentInstructions({ skill, level, config, busy, error, onStart, onBack, summary }) {
  const l = LEVEL_BY_KEY[level], st = LEVEL_STYLE[level], c = normalizeAssessmentConfig(config).levels[level];
  const avail = Math.min(c.questions, questionPool(skill.id, level).filter(q => c.formats.includes(q.type)).length);
  const fmts = ASSESSMENT_FORMATS.filter(f => c.formats.includes(f.id) && questionPool(skill.id, level).some(q => q.type === f.id));
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="instructions">
      <button onClick={onBack} className="flex items-center gap-1.5 text-mute hover:text-ink text-sm mb-6"><Icon name="chevron-left" size={16} /> All assessments</button>
      <Card className="p-6 md:p-8" glow>
        <div className={`text-xs font-mono uppercase tracking-wider ${st.text} mb-1`}>{l.label} assessment</div>
        <h2 className="font-display text-2xl font-semibold mb-1">{skill.name}</h2>
        <p className="text-sm text-mute mb-5">{l.desc}</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[[avail, "questions"], [c.minutes, "minutes"], [`${c.passPct}%`, "to pass"]].map(([v, k]) => (
            <div key={k} className="rounded-xl bg-panel2/60 border border-line py-3 text-center"><div className={`font-mono text-xl font-bold ${st.text}`}>{v}</div><div className="text-xs text-mute">{k}</div></div>
          ))}
        </div>
        <ul className="text-sm text-mute space-y-2 mb-5 list-disc pl-5">
          <li>One question at a time — move back and forward freely; every answer is saved as you go.</li>
          <li>The timer starts when you press Start. When it reaches zero your answers are submitted automatically.</li>
          <li>“Select all” questions need every correct option and no wrong ones. Unanswered questions score zero.</li>
          <li>Formats in this set: {fmts.map(f => f.label).join(", ")}.</li>
          <li>You'll get a topic breakdown and an explanation for every question you missed.</li>
        </ul>
        {summary && summary.attempts > 0 && <p className="text-xs text-mute mb-4">Previous: best {summary.best}%, last {summary.last}% ({summary.attempts} attempt{summary.attempts === 1 ? "" : "s"}). New attempts prefer questions you haven't seen.</p>}
        {avail < c.questions && <p className="text-xs text-warn mb-4">Only {avail} question{avail === 1 ? "" : "s"} are available for this skill and format at the moment.</p>}
        {error && <p className="text-sm text-bad mb-3" role="alert">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={onStart} disabled={busy || avail === 0} iconRight="arrow-right" data-testid="begin-btn">{busy ? "Preparing…" : "Start assessment"}</Button>
          <Button variant="ghost" onClick={onBack}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}

function AssessmentTimer({ deadline, limitSec, onExpire }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000)); setLeft(s);
      if (s <= 0 && !fired.current) { fired.current = true; onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  const low = left <= Math.max(30, limitSec * 0.15);
  return (
    <div role="timer" aria-live="off" data-testid="timer" className={`inline-flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-lg border ${low ? "border-bad/50 text-bad bg-bad/10" : "border-cyan/30 text-cyan bg-cyan/10"}`}>
      <Icon name="clock" size={14} /> {fmtClock(left)}
    </div>
  );
}

function QuestionRenderer({ q, value, onChange }) {
  const multi = q.type === "multi";
  const picked = multi ? (Array.isArray(value) ? value : []) : value;
  const toggle = (i) => {
    if (multi) onChange(picked.includes(i) ? picked.filter(x => x !== i) : [...picked, i].sort((a, b) => a - b));
    else onChange(value === i ? null : i);
  };
  const label = { mcq: "Single choice", multi: "Select all that apply", tf: "True / False", output: "Predict the output", debug: "Find the bug", scenario: "Scenario" }[q.type];
  return (
    <div data-testid="question" data-qtype={q.type}>
      <div className="flex items-center gap-2 mb-3"><Badge tone="cyan">{label}</Badge><span className="text-[11px] text-mute font-mono">{q.topic}</span></div>
      <p className="font-medium mb-3 whitespace-pre-wrap">{q.q}</p>
      {q.code && <pre className="bg-navy border border-line rounded-xl p-4 text-xs md:text-sm font-mono overflow-x-auto mb-4 text-cyan/90"><code>{q.code}</code></pre>}
      <div className="space-y-2" role={multi ? "group" : "radiogroup"}>
        {q.options.map((opt, i) => {
          const on = multi ? picked.includes(i) : picked === i;
          return (
            <button key={i} type="button" role={multi ? "checkbox" : "radio"} aria-checked={on} data-opt={i} onClick={() => toggle(i)}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 text-sm transition-colors ${on ? "border-cyan bg-cyan/10" : "border-line hover:border-indigo/40"}`}>
              <span className={`w-5 h-5 shrink-0 inline-flex items-center justify-center border-2 ${multi ? "rounded-md" : "rounded-full"} ${on ? "border-cyan bg-cyan text-navy" : "border-mute/50"}`}>{on && <Icon name="check" size={12} strokeWidth={3} />}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssessmentNavigation({ questions, answers, idx, onGo, onSubmit, busy }) {
  const answered = questions.filter(q => isAnswered(answers[q.id])).length; const last = idx === questions.length - 1;
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon="chevron-left" disabled={idx === 0} onClick={() => onGo(idx - 1)} data-testid="prev-btn">Previous</Button>
        {!last
          ? <Button size="sm" iconRight="chevron-right" onClick={() => onGo(idx + 1)} data-testid="next-btn">Next</Button>
          : <Button size="sm" iconRight="check" onClick={onSubmit} disabled={busy} data-testid="submit-btn">Submit assessment</Button>}
        <span className="ml-auto text-xs text-mute font-mono">{answered}/{questions.length} answered</span>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Question navigator">
        {questions.map((q, i) => {
          const a = isAnswered(answers[q.id]);
          return <button key={q.id} type="button" onClick={() => onGo(i)} aria-label={`Question ${i + 1}${a ? " answered" : ""}`} aria-current={i === idx} data-nav={i}
            className={`w-8 h-8 rounded-lg text-xs font-mono border transition-colors ${i === idx ? "border-cyan bg-cyan/20 text-cyan" : a ? "border-good/50 bg-good/10 text-good" : "border-line text-mute hover:border-indigo/40"}`}>{i + 1}</button>;
        })}
      </div>
    </div>
  );
}

function AssessmentRunner({ session, skill, answers, idx, busy, error, onAnswer, onGo, onSubmit, onExit }) {
  const [confirm, setConfirm] = useState(false);
  const qs = session.questions; const q = qs[idx]; const st = LEVEL_STYLE[session.level];
  const answered = qs.filter(x => isAnswered(answers[x.id])).length;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8" data-testid="runner">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[180px]">
          <div className={`text-xs font-mono uppercase tracking-wider ${st.text}`}>{LEVEL_BY_KEY[session.level].label} · {skill.name}</div>
          <div className="text-sm text-mute" data-testid="progress-text">Question {idx + 1} of {qs.length}</div>
        </div>
        <AssessmentTimer deadline={session.deadline} limitSec={session.limitSec} onExpire={() => onSubmit(true)} />
      </div>
      <div className="h-1.5 rounded-full bg-white/5 mb-5 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={answered}>
        <div className="h-full bg-gradient-to-r from-indigo to-cyan transition-all" style={{ width: `${(answered / qs.length) * 100}%` }} />
      </div>
      <Card className="p-5 md:p-7">
        <QuestionRenderer key={q.id} q={q} value={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} />
        <AssessmentNavigation questions={qs} answers={answers} idx={idx} onGo={onGo} busy={busy}
          onSubmit={() => (answered < qs.length ? setConfirm(true) : onSubmit(false))} />
      </Card>
      {confirm && (
        <Card className="p-5 mt-4 border-warn/40 !bg-warn/5" role="alertdialog" data-testid="confirm-submit">
          <p className="text-sm mb-3"><b>{qs.length - answered}</b> question{qs.length - answered === 1 ? " is" : "s are"} unanswered and will score zero. Submit anyway?</p>
          <div className="flex gap-3"><Button size="sm" onClick={() => { setConfirm(false); onSubmit(false); }} disabled={busy} data-testid="confirm-yes">Submit now</Button><Button size="sm" variant="secondary" onClick={() => setConfirm(false)}>Keep working</Button></div>
        </Card>
      )}
      {error && <p className="text-sm text-bad mt-3" role="alert">{error}</p>}
      <div className="mt-4"><button onClick={onExit} className="text-xs text-mute hover:text-ink">Leave for now — your progress stays saved and you can resume from the assessment home.</button></div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
function PerformanceAnalytics({ topics }) {
  return (
    <div className="space-y-2.5" data-testid="topic-chart">
      {topics.map(t => (
        <div key={t.topic}>
          <div className="flex justify-between text-xs mb-1"><span>{t.topic}</span><span className="font-mono text-mute">{t.correct}/{t.total} · {t.pct}%</span></div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.pct >= 75 ? "#22C55E" : t.pct >= 50 ? "#F59E0B" : "#F43F5E" }} /></div>
        </div>
      ))}
    </div>
  );
}

function AssessmentResults({ result, skill, recs, history, onRetake, onStart, onBack }) {
  const st = LEVEL_STYLE[result.level]; const l = LEVEL_BY_KEY[result.level];
  const wrong = result.review.filter(r => !r.correct);
  const [showAll, setShowAll] = useState(false);
  const fmt = (r, v) => (v === null || v === undefined ? "—" : (Array.isArray(v) ? v : [v]).map(i => r.options[i]).join("; "));
  const delta = result.prev ? result.pct - result.prev.pct : null;
  const list = showAll ? result.review : wrong;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="results">
      <Card className="p-6 md:p-8 text-center fade-up" glow>
        <div className={`text-xs font-mono uppercase tracking-wider ${st.text} mb-3`}>{l.label} · {skill.name}</div>
        <ScoreRing score={result.pct} size={130} label="Score" sub={`${result.correct}/${result.total}`} />
        <h3 className="font-display text-2xl font-semibold mt-4" data-testid="verdict">{result.passed ? "Passed" : "Not passed yet"} <span className="text-mute text-base font-normal">· pass mark {result.passPct}%</span></h3>
        {result.auto && <p className="text-xs text-warn mt-1">Time ran out — your saved answers were submitted automatically.</p>}
        {delta !== null && <p className="text-xs text-mute mt-1">{delta > 0 ? `▲ ${delta} points better` : delta < 0 ? `▼ ${-delta} points lower` : "Same score"} than your previous {l.label} attempt ({result.prev.pct}%).</p>}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 text-left">
          {[["Correct", result.correct, "text-good"], ["Incorrect", result.incorrect, "text-bad"], ["Unanswered", result.unanswered, "text-warn"], ["Percentage", `${result.pct}%`, "text-cyan"], ["Time used", fmtClock(result.timeSec), "text-indigo"]].map(([k, v, c]) => (
            <div key={k} className="rounded-xl bg-panel2/60 border border-line px-3 py-2.5"><div className={`font-mono text-lg font-bold ${c}`}>{v}</div><div className="text-[11px] text-mute">{k}</div></div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <Card className="p-5"><h4 className="font-display font-medium mb-3">Topic-wise performance</h4><PerformanceAnalytics topics={result.topics} /></Card>
        <Card className="p-5">
          <h4 className="font-display font-medium mb-3">Improvement areas</h4>
          {result.weakTopics.length ? <ul className="text-sm text-mute space-y-1.5 list-disc pl-5">{result.weakTopics.map(t => <li key={t}>Revisit <b className="text-ink">{t}</b> — you scored below 60% here.</li>)}</ul>
            : <p className="text-sm text-mute">No weak topics in this attempt{result.strongTopics.length ? ` — strongest: ${result.strongTopics.slice(0, 2).join(", ")}` : ""}.</p>}
          <div className="mt-4 text-xs text-mute">Skill evidence is now <b className="text-ink">{result.composite}%</b> (Basic 40% · Intermediate 35% · Advanced 25% of best scores).</div>
        </Card>
      </div>

      {recs.length > 0 && (
        <Card className="p-5 mt-5 !bg-indigo/5 border-indigo/25" data-testid="next-recs">
          <div className="flex items-center gap-2 mb-3 text-indigo text-sm font-medium"><Icon name="sparkles" size={15} /> Recommended next</div>
          <div className="space-y-2">
            {recs.map(r => (
              <div key={r.skillId + r.level} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex-1 min-w-[200px] text-mute"><b className="text-ink">{r.skillName} — {LEVEL_BY_KEY[r.level].label}.</b> {r.reason}</span>
                <Button size="sm" variant="secondary" onClick={() => onStart(r.skillId, r.level)}>Start</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-medium">{showAll ? "All questions" : `Review: ${wrong.length} to learn from`}</h4>
          <button onClick={() => setShowAll(s => !s)} className="text-xs text-cyan hover:text-ink">{showAll ? "Show mistakes only" : "Show all questions"}</button>
        </div>
        {list.length === 0 && <p className="text-sm text-good">Every question was answered correctly. 🎯</p>}
        <div className="space-y-4">
          {list.map(r => (
            <div key={r.id} className={`rounded-xl border p-4 ${r.correct ? "border-good/30" : "border-bad/30"}`} data-testid="review-item">
              <div className="flex items-center gap-2 mb-1"><Badge tone={r.correct ? "good" : "bad"}>{r.correct ? "Correct" : r.answered ? "Incorrect" : "Unanswered"}</Badge><span className="text-[11px] text-mute font-mono">Q{r.n} · {r.topic}</span></div>
              <p className="text-sm font-medium whitespace-pre-wrap mb-2">{r.q}</p>
              {r.code && <pre className="bg-navy border border-line rounded-lg p-3 text-xs font-mono overflow-x-auto mb-2 text-cyan/90"><code>{r.code}</code></pre>}
              {!r.correct && <p className="text-xs text-bad mb-1">Your answer: {fmt(r, r.given)}</p>}
              <p className="text-xs text-good mb-1">Correct answer: {fmt(r, r.answer)}</p>
              <p className="text-xs text-mute">{r.explain}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button onClick={onRetake} variant="secondary">Retake {l.label}</Button>
        <Button onClick={onBack} iconRight="arrow-right" data-testid="back-home">Back to assessments</Button>
      </div>
    </div>
  );
}

function AssessmentHistory({ history, career }) {
  const rows = history.filter(h => career.skills.some(s => s.id === h.skillId)).slice().reverse().slice(0, 12);
  if (!rows.length) return null;
  return (
    <Card className="p-5 mt-8" data-testid="history">
      <h3 className="font-display text-lg font-medium mb-3">Assessment history</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-mute font-mono"><th className="py-2 pr-3">Skill</th><th className="pr-3">Level</th><th className="pr-3">Score</th><th className="pr-3">Result</th><th className="pr-3">Time</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map(h => (
              <tr key={h.id} className="border-t border-line">
                <td className="py-2 pr-3">{h.skillName}</td>
                <td className={`pr-3 ${LEVEL_STYLE[h.level].text}`}>{LEVEL_BY_KEY[h.level].label}</td>
                <td className="pr-3"><span className="inline-block h-1.5 rounded-full align-middle mr-2" style={{ width: Math.max(4, h.pct * 0.6), background: LEVEL_STYLE[h.level].bar }} /><span className="font-mono">{h.pct}%</span></td>
                <td className="pr-3"><Badge tone={h.passed ? "good" : "warn"}>{h.passed ? "Passed" : "Not passed"}</Badge></td>
                <td className="pr-3 font-mono text-mute">{fmtClock(h.timeSec)}</td>
                <td className="text-mute text-xs">{new Date(h.at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AssessmentSettings({ config, editable, onSave, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(normalizeAssessmentConfig(config))));
  const [msg, setMsg] = useState(""); const [saving, setSaving] = useState(false);
  const upd = (lvl, k, v) => setDraft(d => ({ levels: { ...d.levels, [lvl]: { ...d.levels[lvl], [k]: v } } }));
  const toggleFmt = (lvl, f) => { const cur = draft.levels[lvl].formats; upd(lvl, "formats", cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f]); };
  const save = async () => { setSaving(true); setMsg(""); try { await onSave(draft); setMsg("Saved."); } catch (e) { setMsg(e.message || "Could not save."); } setSaving(false); };
  const numCls = "w-20 bg-panel2 border border-line rounded-lg px-2 py-1.5 text-sm font-mono text-ink";
  return (
    <div className="p-6" data-testid="settings">
      <h3 className="font-display text-xl font-semibold mb-1">Assessment settings</h3>
      <p className="text-xs text-mute mb-4">{editable ? "Question count, time limit, pass mark and question formats for each level. Changes apply to new attempts." : "Only administrators can change these. Contact your administrator (see ADMIN_EMAILS in the README)."}</p>
      <div className="space-y-4">
        {ASSESSMENT_LEVELS.map(l => { const c = draft.levels[l.id]; return (
          <div key={l.id} className={`rounded-xl border p-4 ${LEVEL_STYLE[l.id].border}`}>
            <div className="flex items-center justify-between mb-3"><span className={`font-medium ${LEVEL_STYLE[l.id].text}`}>{l.label}</span>
              <label className="text-xs text-mute flex items-center gap-2"><input type="checkbox" disabled={!editable} checked={c.enabled} onChange={e => upd(l.id, "enabled", e.target.checked)} /> Enabled</label></div>
            <div className="flex flex-wrap gap-4 text-xs text-mute mb-3">
              <label>Questions <input type="number" min="1" max="50" disabled={!editable} value={c.questions} onChange={e => upd(l.id, "questions", e.target.value)} className={numCls} data-set={`${l.id}-questions`} /></label>
              <label>Minutes <input type="number" min="1" max="180" disabled={!editable} value={c.minutes} onChange={e => upd(l.id, "minutes", e.target.value)} className={numCls} data-set={`${l.id}-minutes`} /></label>
              <label>Pass % <input type="number" min="1" max="100" disabled={!editable} value={c.passPct} onChange={e => upd(l.id, "passPct", e.target.value)} className={numCls} data-set={`${l.id}-pass`} /></label>
            </div>
            <div className="flex flex-wrap gap-2">{ASSESSMENT_FORMATS.map(f => (
              <button key={f.id} type="button" disabled={!editable} onClick={() => toggleFmt(l.id, f.id)} aria-pressed={c.formats.includes(f.id)}
                className={`text-xs px-2.5 py-1 rounded-full border ${c.formats.includes(f.id) ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute"}`}>{f.label}</button>))}</div>
          </div>); })}
      </div>
      <div className="flex items-center gap-3 mt-5">
        {editable && <Button onClick={save} disabled={saving} data-testid="save-settings">Save settings</Button>}
        {editable && <Button variant="ghost" onClick={() => setDraft(defaultAssessmentConfig())}>Reset to defaults</Button>}
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {msg && <span className="text-xs text-mute" role="status">{msg}</span>}
      </div>
    </div>
  );
}
