// ============================================================================
// AI INTERVIEW SIMULATOR — dashboard → configuration → live workspace → report → history.
// Components: InterviewDashboard, InterviewCategoryCard, InterviewConfiguration, InterviewWorkspace,
// AIInterviewer, QuestionPanel, AnswerInput, CodingEditor, InterviewTimer, InterviewProgress,
// InterviewResults, InterviewHistory, InterviewAnalytics.
// Props: profile, career, githubData, resumeData, history (interviewHistory[]), onComplete(entry)
// ============================================================================
const IV_DRAFT_KEY = "skillpilot:interviewDraft";
const ivLoadDraft = () => { try { const d = JSON.parse(localStorage.getItem(IV_DRAFT_KEY) || "null"); return d && d.session && !d.session.done && d.session.startedAt + d.session.limitSec * 1000 > Date.now() ? d : null; } catch (e) { return null; } };
const ivSaveDraft = (d) => { try { d ? localStorage.setItem(IV_DRAFT_KEY, JSON.stringify(d)) : localStorage.removeItem(IV_DRAFT_KEY); } catch (e) { /* ignore */ } };
const ivSpeechRec = () => (typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null);
const IV_DIMS = [["accuracy", "Technical accuracy"], ["understanding", "Conceptual understanding"], ["problemSolving", "Problem-solving"], ["communication", "Communication clarity"], ["practical", "Practical knowledge"], ["completeness", "Completeness"], ["reasoning", "Logical reasoning"]];

function Interview({ profile, career, githubData, resumeData, history, onComplete, lastResult }) {
  const hist = history || [];
  const [phase, setPhase] = useState("home");              // home | config | run | results
  const [cfg, setCfg] = useState(null);
  const [session, setSession] = useState(null);
  const [report, setReport] = useState(null);
  const [viewing, setViewing] = useState(null);             // a saved history entry
  const [draft, setDraft] = useState(() => ivLoadDraft());
  const [busy, setBusy] = useState(false);

  const openConfig = (category, base) => {
    const careerId = (base && base.careerId) || career.id;
    const level = (base && base.level) || "basic";
    setCfg({ ...defaultInterviewConfig(careerId, category, level), ...(base ? { language: base.language || "javascript" } : {}) });
    setPhase("config"); window.scrollTo && window.scrollTo(0, 0);
  };
  const careerFor = (id) => CAREER_BY_ID[id] || career;
  const begin = (config) => {
    const c = careerFor(config.careerId);
    const exclude = hist.filter(h => h.category === config.category && h.careerId === config.careerId).slice(-3).flatMap(h => (h.questions || []).map(q => q.qid)).filter(Boolean);
    const s = startInterview(config, { career: c, githubData, resumeData, profile }, { seed: `${config.careerId}:${config.category}:${config.level}:${Date.now()}:${Math.random()}`, exclude });
    setSession(s); setReport(null); setPhase("run"); ivSaveDraft({ session: s, text: "", code: "", expl: "" }); window.scrollTo && window.scrollTo(0, 0);
  };
  const resume = () => { setSession(draft.session); setPhase("run"); };
  const finish = (s, timedOut) => {
    const r = buildInterviewReport(s, { timedOut });
    const entry = interviewHistoryEntry(s, r, { id: "iv-" + Date.now(), at: new Date().toISOString() });
    const prev = hist.filter(h => h.category === s.config.category && h.level === s.config.level && h.careerId === s.config.careerId).slice(-1)[0] || null;
    ivSaveDraft(null); setDraft(null); setReport({ ...r, entry, prev, session: s }); setPhase("results"); onComplete(entry); window.scrollTo && window.scrollTo(0, 0);
  };
  const home = () => { setPhase("home"); setSession(null); setReport(null); setViewing(null); setDraft(ivLoadDraft()); };

  if (phase === "config" && cfg) return <InterviewConfiguration cfg={cfg} setCfg={setCfg} career={career} profile={profile} githubData={githubData} resumeData={resumeData} onBack={home} onStart={() => begin(normalizeInterviewConfig(cfg))} />;
  if (phase === "run" && session) return <InterviewWorkspace session={session} setSession={setSession} onFinish={finish} onExit={home} />;
  if (phase === "results" && report) return <InterviewResults report={report} history={hist} onRetry={() => openConfig(report.session.config.category, report.session.config)} onBack={home} />;
  if (viewing) return <InterviewResults saved={viewing} history={hist} onRetry={() => openConfig(viewing.category, { careerId: viewing.careerId, level: viewing.level, language: viewing.language })} onBack={() => setViewing(null)} />;

  return <InterviewDashboard career={career} history={hist} draft={draft} lastResult={lastResult} onPick={openConfig} onResume={resume}
    onDiscard={() => { ivSaveDraft(null); setDraft(null); }} onView={setViewing} onRetry={(h) => openConfig(h.category, { careerId: h.careerId, level: h.level, language: h.language })} />;
}

// ------------------------------------------------------------------------------------------------
function InterviewCategoryCard({ cat, last, onClick }) {
  return (
    <button type="button" onClick={onClick} data-cat={cat.id}
      className="text-left glass rounded-2xl p-5 border border-line hover:border-cyan/50 hover:-translate-y-0.5 hover:shadow-cyanglow transition-all group">
      <div className="w-10 h-10 rounded-xl bg-indigo/10 text-indigo group-hover:bg-gradient-to-br group-hover:from-indigo group-hover:to-cyan group-hover:text-white flex items-center justify-center mb-3 transition-colors"><Icon name={cat.icon} size={18} /></div>
      <h3 className="font-display font-medium mb-1">{cat.label}</h3>
      <p className="text-xs text-mute mb-3">{cat.desc}</p>
      <div className="flex flex-wrap gap-1.5">{INTERVIEW_LEVEL_IDS.map(l => <span key={l} className={`text-[10px] px-2 py-0.5 rounded-full border ${LEVEL_STYLE[l].border} ${LEVEL_STYLE[l].text}`}>{INTERVIEW_LEVEL_LABEL[l]}</span>)}</div>
      {last && <div className="text-[11px] text-mute mt-3 font-mono">Last: {last.overall}% · {INTERVIEW_LEVEL_LABEL[last.level]}</div>}
    </button>
  );
}

function InterviewDashboard({ career, history, draft, lastResult, onPick, onResume, onDiscard, onView, onRetry }) {
  const [tab, setTab] = useState("start");
  const lastBy = {}; history.forEach(h => { lastBy[h.category] = h; });
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="interview-home">
      <SectionTitle eyebrow="AI Interview Simulator" title="Practice with an interviewer that knows your profile"
        sub={`Questions are generated for your target career — ${career.name} — and adapt to how you answer.`}
        right={<div className="flex gap-2">{[["start", "Start interview"], ["history", `History (${history.length})`]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} data-tab={k} className={`text-sm px-3.5 py-2 rounded-xl border ${tab === k ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute hover:text-ink"}`}>{l}</button>))}</div>} />
      {draft && (
        <Card className="p-4 mb-5 !bg-warn/5 border-warn/30 flex flex-wrap items-center gap-3" data-testid="iv-resume">
          <Icon name="clock" size={16} className="text-warn" />
          <span className="text-sm flex-1 min-w-[200px]">Unfinished <b>{INTERVIEW_CATEGORY_BY_ID[draft.session.config.category].label}</b> interview ({INTERVIEW_LEVEL_LABEL[draft.session.config.level]}) — {draft.session.turns.length}/{draft.session.total} answered. Your progress is saved.</span>
          <Button size="sm" onClick={onResume} data-testid="iv-resume-btn">Resume</Button><Button size="sm" variant="ghost" onClick={onDiscard}>Discard</Button>
        </Card>
      )}
      {tab === "start" ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTERVIEW_CATEGORIES.map(c => <InterviewCategoryCard key={c.id} cat={c} last={lastBy[c.id]} onClick={() => onPick(c.id)} />)}
          </div>
          {history.length > 0 && <InterviewAnalytics history={history} />}
          {history.length === 0 && lastResult && (
            <Card className="p-6 mt-8"><h3 className="font-display font-medium mb-4">Earlier interview result</h3>
              <div className="grid sm:grid-cols-3 gap-4"><ScoreBar label="Technical" score={lastResult.technical} /><ScoreBar label="Communication" score={lastResult.communication} /><ScoreBar label="Problem-solving" score={lastResult.problemSolving} /></div></Card>
          )}
        </>
      ) : <InterviewHistory history={history} onView={onView} onRetry={onRetry} />}
    </div>
  );
}

function InterviewConfiguration({ cfg, setCfg, career, profile, githubData, resumeData, onBack, onStart }) {
  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const setLevel = (level) => setCfg(c => { const d = defaultInterviewConfig(c.careerId, c.category, level); return { ...c, level, questions: d.questions, minutes: d.minutes }; });
  const cat = INTERVIEW_CATEGORY_BY_ID[cfg.category]; const sel = CAREER_BY_ID[cfg.careerId] || career;
  const secondary = (profile.secondaryCareers || []).map(id => CAREER_BY_ID[id]).filter(Boolean);
  const all = CAREERS.slice().sort((a, b) => a.name.localeCompare(b.name));
  const ev = cfg.category === "project" ? interviewEvidence({ githubData, resumeData, profile }) : [];
  const needsLang = cfg.category === "coding" || cfg.category === "technical";
  const speechOk = !!ivSpeechRec();
  const lbl = "text-xs font-mono uppercase tracking-wider text-mute mb-1.5 block";
  const sc = "w-full bg-panel2 border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:border-indigo/60";
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="iv-config">
      <button onClick={onBack} className="flex items-center gap-1.5 text-mute hover:text-ink text-sm mb-6"><Icon name="chevron-left" size={16} /> All interviews</button>
      <Card className="p-6 md:p-8" glow>
        <div className="flex items-center gap-3 mb-5"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo to-cyan flex items-center justify-center"><Icon name={cat.icon} size={20} className="text-white" /></div>
          <div><div className="text-xs font-mono text-cyan uppercase tracking-wider">Configure interview</div><h2 className="font-display text-xl font-semibold">{cat.label} interview</h2></div></div>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div><label className={lbl} htmlFor="iv-career">Target career</label>
            <select id="iv-career" className={sc} value={cfg.careerId} onChange={e => set("careerId", e.target.value)} data-testid="iv-career">
              <option value={career.id}>{career.name} (your target)</option>
              {secondary.filter(c => c.id !== career.id).map(c => <option key={c.id} value={c.id}>{c.name} (secondary)</option>)}
              <optgroup label="All careers">{all.map(c => <option key={"a" + c.id} value={c.id}>{c.name}</option>)}</optgroup>
            </select></div>
          <div><label className={lbl} htmlFor="iv-cat">Interview category</label>
            <select id="iv-cat" className={sc} value={cfg.category} onChange={e => setCfg(c => ({ ...defaultInterviewConfig(c.careerId, e.target.value, c.level), language: c.language, mode: c.mode }))} data-testid="iv-cat">
              {INTERVIEW_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        </div>
        <label className={lbl}>Difficulty</label>
        <div className="grid sm:grid-cols-3 gap-3 mb-5" role="radiogroup" aria-label="Difficulty">
          {INTERVIEW_LEVEL_IDS.map(l => { const st = LEVEL_STYLE[l], on = cfg.level === l; return (
            <button key={l} type="button" role="radio" aria-checked={on} data-iv-level={l} onClick={() => setLevel(l)}
              className={`text-left rounded-xl p-4 border-2 transition-all ${on ? `${st.ring} ${st.bg}` : "border-line hover:border-cyan/40"}`}>
              <div className={`font-display font-medium ${st.text}`}>{INTERVIEW_LEVEL_LABEL[l]}</div><p className="text-xs text-mute mt-1">{INTERVIEW_LEVEL_DESC[l]}</p></button>); })}
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div><label className={lbl} htmlFor="iv-q">Questions</label><input id="iv-q" type="number" min="1" max="15" className={sc} value={cfg.questions} onChange={e => set("questions", e.target.value)} data-testid="iv-questions" /></div>
          <div><label className={lbl} htmlFor="iv-min">Duration (minutes)</label><input id="iv-min" type="number" min="5" max="120" className={sc} value={cfg.minutes} onChange={e => set("minutes", e.target.value)} data-testid="iv-minutes" /></div>
          <div><label className={lbl} htmlFor="iv-lang">Programming language</label>
            <select id="iv-lang" className={sc} value={cfg.language} onChange={e => set("language", e.target.value)} disabled={!needsLang} data-testid="iv-lang">
              {CODE_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}{l.runs ? " (code is executed)" : ""}</option>)}</select></div>
        </div>
        <label className={lbl}>Interview mode</label>
        <div className="flex flex-wrap gap-3 mb-5">
          {[["text", "Text interview"], ["voice", "Voice (beta)"]].map(([m, l]) => (
            <button key={m} type="button" aria-pressed={cfg.mode === m} onClick={() => set("mode", m)} data-mode={m}
              className={`text-sm px-4 py-2 rounded-xl border ${cfg.mode === m ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute"}`}>{l}</button>))}
          {cfg.mode === "voice" && <p className="text-xs text-mute basis-full">{speechOk ? "Questions are read aloud and you can dictate answers with your microphone. Speech is only converted to text — nothing about your voice or accent is evaluated." : "Your browser doesn't support speech recognition, so you can still hear questions but must type answers (try Chrome or Edge)."}</p>}
        </div>
        {cfg.category === "project" && (
          <div className="rounded-xl border border-line bg-panel2/50 p-4 mb-5 text-sm" data-testid="iv-evidence">
            {ev.length ? <><div className="text-good text-xs font-medium mb-1">Evidence found — questions will use only this:</div><ul className="text-mute text-xs list-disc pl-5 space-y-0.5">{ev.slice(0, 4).map((e, i) => <li key={i}>{e.source === "github" ? `GitHub: ${e.name}` : `Resume: ${e.line.slice(0, 90)}…`}</li>)}</ul></>
              : <p className="text-warn text-xs">No GitHub or resume project evidence yet. I won't invent details — I'll ask you to choose a project instead. Use GitHub Analyzer / Resume Intelligence for tailored questions.</p>}
          </div>)}
        <p className="text-xs text-mute mb-5">Generated for <b className="text-ink">{sel.name}</b> ({sel.skills.length} core skills). Answers are scored on accuracy, understanding, problem-solving, clarity, practical knowledge, completeness and reasoning — with feedback on every question.</p>
        <div className="flex gap-3"><Button onClick={onStart} iconRight="arrow-right" data-testid="iv-start">Start interview</Button><Button variant="ghost" onClick={onBack}>Cancel</Button></div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
function InterviewTimer({ deadline, limitSec, onExpire }) { return <AssessmentTimer deadline={deadline} limitSec={limitSec} onExpire={onExpire} />; }

function InterviewProgress({ done, total, current }) {
  return (
    <div data-testid="iv-progress">
      <div className="flex justify-between text-xs text-mute mb-1.5"><span>Question {Math.min(current, total)} of {total}</span><span>{done} answered</span></div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div className="h-full bg-gradient-to-r from-indigo to-cyan transition-all" style={{ width: `${(done / total) * 100}%` }} /></div>
    </div>
  );
}

function AIInterviewer({ session, speaking, thinking }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [session.messages.length]);
  return (
    <Card className="p-4 flex flex-col h-full" data-testid="ai-interviewer">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-indigo to-cyan flex items-center justify-center ${speaking ? "shadow-cyanglow" : ""}`}><Icon name="sparkles" size={20} className="text-white" /></div>
        <div><div className="font-display font-medium leading-tight">Aria</div><div className="text-[11px] text-mute">AI interviewer · {thinking ? "reviewing your answer…" : "listening"}</div></div>
      </div>
      <div ref={ref} className="flex-1 min-h-[160px] max-h-[360px] overflow-y-auto space-y-2.5 pr-1" aria-live="polite">
        {session.messages.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed rounded-xl px-3 py-2 ${m.from === "ai" ? (m.q ? "bg-indigo/10 border border-indigo/20 text-ink" : "bg-panel2/70 text-mute") : "bg-cyan/10 border border-cyan/20 text-ink ml-6"}`}>
            {m.from === "you" ? <span className="whitespace-pre-wrap">{String(m.text).slice(0, 220)}{String(m.text).length > 220 ? "…" : ""}</span> : <span className="whitespace-pre-wrap">{m.q ? `Q${m.n}: ${String(m.text).split("\n")[0].slice(0, 160)}` : m.text}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuestionPanel({ q, n, total, level }) {
  const st = LEVEL_STYLE[level];
  const label = q.kind === "followup" ? "Follow-up" : { coding: "Coding", behavioral: "Behavioural", design: "System design", "code-reason": "Code reasoning" }[q.type] || "Question";
  return (
    <Card className="p-5 md:p-6" data-testid="question-panel" data-qkind={q.kind}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge tone="cyan">{label}</Badge><Badge tone={st.tone}>{INTERVIEW_LEVEL_LABEL[level]}</Badge>
        <span className="text-[11px] text-mute font-mono">{String(q.topic || "").slice(0, 80)}</span>
      </div>
      <p className="font-medium leading-relaxed whitespace-pre-wrap" data-testid="iv-question-text">{q.q}</p>
      {q.code && <pre className="bg-navy border border-line rounded-xl p-4 text-xs md:text-sm font-mono overflow-x-auto mt-3 text-cyan/90"><code>{q.code}</code></pre>}
    </Card>
  );
}

function AnswerInput({ value, onChange, voice, disabled }) {
  const [listening, setListening] = useState(false); const recRef = useRef(null);
  const SR = ivSpeechRec();
  const toggle = () => {
    if (listening && recRef.current) { recRef.current.stop(); return; }
    if (!SR) return;
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e) => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript + " "; if (t) onChange((value ? value.trim() + " " : "") + t.trim()); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  };
  useEffect(() => () => { try { recRef.current && recRef.current.stop(); } catch (e) { /* ignore */ } }, []);
  return (
    <div>
      <textarea value={value} onChange={e => onChange(e.target.value)} disabled={disabled} data-testid="iv-answer" aria-label="Your answer"
        placeholder="Type your answer as you would say it in a real interview…"
        className="w-full min-h-[160px] resize-y bg-panel2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60" />
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-mute">
        <span>{value.trim().split(/\s+/).filter(Boolean).length} words</span>
        {voice && SR && <button type="button" onClick={toggle} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${listening ? "border-bad text-bad" : "border-line hover:text-ink"}`} data-testid="mic-btn">{listening ? "● Stop dictation" : "🎤 Dictate answer"}</button>}
      </div>
    </div>
  );
}

function CodingEditor({ q, language, code, setCode, expl, setExpl, runResult, running, onRun }) {
  const lang = CODE_LANGUAGES.find(l => l.id === language) || CODE_LANGUAGES[0];
  const onKey = (e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.target, s = t.selectionStart; setCode(code.slice(0, s) + "  " + code.slice(t.selectionEnd)); setTimeout(() => { t.selectionStart = t.selectionEnd = s + 2; }); } };
  return (
    <div className="space-y-3" data-testid="coding-editor">
      <div className="flex items-center justify-between text-xs text-mute"><span className="font-mono">{lang.label} · {q.coding.fn}({q.coding.params})</span>
        <span>{lang.runs ? "Runs against hidden tests in your browser" : "Not executed — static review only (pick JavaScript to run tests)"}</span></div>
      <textarea value={code} onChange={e => setCode(e.target.value)} onKeyDown={onKey} spellCheck={false} aria-label="Code editor" data-testid="code-input"
        className="w-full min-h-[240px] resize-y bg-navy border border-line rounded-xl px-4 py-3 text-sm font-mono text-cyan/90 focus:border-indigo/60" />
      <textarea value={expl} onChange={e => setExpl(e.target.value)} aria-label="Explain your approach" data-testid="code-explain"
        placeholder="Explain your approach: time & space complexity, edge cases you handled…"
        className="w-full min-h-[80px] resize-y bg-panel2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60" />
      <div className="flex flex-wrap items-center gap-3">
        {lang.runs && <Button size="sm" variant="secondary" icon="play" onClick={onRun} disabled={running} data-testid="run-tests">{running ? "Running…" : "Run tests"}</Button>}
        {runResult && <span className={`text-xs font-mono ${runResult.error ? "text-bad" : runResult.passed === runResult.total ? "text-good" : "text-warn"}`} data-testid="run-result">
          {runResult.error ? runResult.error : `${runResult.passed}/${runResult.total} tests passed${runResult.failures[0] ? ` — e.g. ${q.coding.fn}(${runResult.failures[0].args.map(a => JSON.stringify(a)).join(", ")}) expected ${JSON.stringify(runResult.failures[0].expected)}` : ""}`}</span>}
      </div>
    </div>
  );
}

function InterviewWorkspace({ session, setSession, onFinish, onExit }) {
  const q = session.current; const cfg = session.config;
  const [text, setText] = useState(() => (ivLoadDraft() || {}).text || "");
  const [code, setCode] = useState(() => (ivLoadDraft() || {}).code || (q && q.type === "coding" ? codingStarter(q.coding.id, cfg.language) : ""));
  const [expl, setExpl] = useState(() => (ivLoadDraft() || {}).expl || "");
  const [runResult, setRunResult] = useState(null); const [running, setRunning] = useState(false); const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false); const [speaking, setSpeaking] = useState(false);
  const deadline = session.startedAt + session.limitSec * 1000;
  const voice = cfg.mode === "voice";

  useEffect(() => { ivSaveDraft({ session, text, code, expl }); }, [session, text, code, expl]);
  useEffect(() => {   // read the question aloud in voice mode
    if (!voice || !q || typeof window === "undefined" || !window.speechSynthesis) return;
    try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(q.q).split("\n")[0]); u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); window.speechSynthesis.speak(u); } catch (e) { /* ignore */ }
    return () => { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } };
  }, [q && q.id]);

  const advance = (next) => {
    setText(""); setExpl(""); setRunResult(null);
    setCode(next.current && next.current.type === "coding" ? codingStarter(next.current.coding.id, cfg.language) : "");
    if (next.done) onFinish(next, false); else setSession(next);
  };
  const run = async () => { setRunning(true); const r = await runJsTests(code, q.coding.id); setRunResult(r); setRunning(false); return r; };
  const submit = async (skip) => {
    if (busy || !q) return; setBusy(true);
    let next;
    if (q.type === "coding") {
      let r = runResult; if (!skip && cfg.language === "javascript" && code.trim()) r = await run();
      next = submitTurn(session, skip ? "" : { code, explanation: expl, language: cfg.language, run: cfg.language === "javascript" ? r : null }, { skip });
    } else next = submitTurn(session, text, { skip });
    setBusy(false); advance(next);
  };
  const timeUp = () => { const s = submitTurn(session, q && q.type === "coding" ? { code, explanation: expl, language: cfg.language } : text, { finish: true }); onFinish({ ...s, done: true }, true); };
  const endNow = () => { const has = q && (q.type === "coding" ? code.trim() : text.trim()); const s = has ? submitTurn(session, q.type === "coding" ? { code, explanation: expl, language: cfg.language } : text, { finish: true }) : session; onFinish({ ...s, done: true }, false); };
  const answered = session.turns.length;
  const canSubmit = q && (q.type === "coding" ? code.trim() && !/^\s*$/.test(code) : text.trim().length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8" data-testid="iv-workspace">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[220px]"><div className="text-xs font-mono uppercase tracking-wider text-cyan">{INTERVIEW_CATEGORY_BY_ID[cfg.category].label} · {session.careerName}</div>
          <InterviewProgress done={answered} total={session.total} current={answered + 1} /></div>
        <InterviewTimer deadline={deadline} limitSec={session.limitSec} onExpire={timeUp} />
      </div>
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <AIInterviewer session={session} speaking={speaking} thinking={busy} />
        <div className="space-y-4">
          {q && <QuestionPanel q={q} n={answered + 1} total={session.total} level={q.level || cfg.level} />}
          {q && (q.type === "coding"
            ? <CodingEditor q={q} language={cfg.language} code={code} setCode={setCode} expl={expl} setExpl={setExpl} runResult={runResult} running={running} onRun={run} />
            : <AnswerInput value={text} onChange={setText} voice={voice} disabled={busy} />)}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => submit(false)} disabled={busy || !canSubmit} iconRight="send" data-testid="iv-submit">{busy ? "Evaluating…" : "Submit answer"}</Button>
            <Button variant="secondary" onClick={() => submit(true)} disabled={busy} data-testid="iv-skip">Skip question</Button>
            <button onClick={() => setConfirmEnd(true)} className="ml-auto text-xs text-mute hover:text-bad" data-testid="iv-end">End interview</button>
          </div>
          {confirmEnd && (
            <Card className="p-4 border-warn/40 !bg-warn/5" role="alertdialog" data-testid="iv-confirm-end">
              <p className="text-sm mb-3">End now? Unanswered questions score zero and you'll get your report.</p>
              <div className="flex gap-3"><Button size="sm" onClick={endNow} data-testid="iv-end-yes">End and see report</Button><Button size="sm" variant="secondary" onClick={() => setConfirmEnd(false)}>Keep going</Button><Button size="sm" variant="ghost" onClick={onExit}>Leave (progress saved)</Button></div>
            </Card>)}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
function IVQuestionReview({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3" data-testid="iv-review">
      {items.map(x => (
        <div key={x.n} className="rounded-xl border border-line">
          <button type="button" onClick={() => setOpen(open === x.n ? null : x.n)} className="w-full flex items-center gap-3 px-4 py-3 text-left" data-review={x.n}>
            <Badge tone={x.skipped ? "mute" : x.score >= 70 ? "good" : x.score >= 40 ? "warn" : "bad"}>{x.skipped ? "Skipped" : x.score + "%"}</Badge>
            <span className="flex-1 text-sm truncate">Q{x.n}{x.kind === "followup" ? " (follow-up)" : ""} · {x.q.split("\n")[0].slice(0, 110)}</span>
            <Icon name="chevron-down" size={15} className={`text-mute transition-transform ${open === x.n ? "rotate-180" : ""}`} />
          </button>
          {open === x.n && (
            <div className="px-4 pb-4 space-y-2.5 text-sm">
              <p className="whitespace-pre-wrap text-ink">{x.q}</p>
              {x.code && <pre className="bg-navy border border-line rounded-lg p-3 text-xs font-mono overflow-x-auto text-cyan/90"><code>{x.code}</code></pre>}
              <div><div className="text-[11px] font-mono text-mute uppercase mb-1">Your answer</div><pre className="whitespace-pre-wrap text-xs text-mute bg-panel2/60 rounded-lg p-3 font-body">{x.a || "(no answer)"}</pre>{x.expl && <p className="text-xs text-mute mt-1">Explanation: {x.expl}</p>}</div>
              {x.coding && <p className="text-xs text-mute">{x.coding.language} · {x.coding.executed ? `${x.coding.passed}/${x.coding.total} tests passed` : "not executed (static review)"}</p>}
              {x.matched.length > 0 && <p className="text-xs text-good">Covered: {x.matched.join(", ")}</p>}
              <ul className="text-xs text-mute list-disc pl-5 space-y-0.5">{x.feedback.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>)}
        </div>
      ))}
    </div>
  );
}

function InterviewResults({ report, saved, history, onRetry, onBack }) {
  const e = saved || report.entry; const lvl = e.level; const st = LEVEL_STYLE[lvl];
  const topics = e.topics.map(([topic, pct, n]) => ({ topic, pct, n }));
  const prev = report ? report.prev : history.filter(h => h.id !== e.id && h.category === e.category && h.level === e.level && h.careerId === e.careerId && h.at < e.at).slice(-1)[0];
  const delta = prev ? e.overall - prev.overall : null;
  const learning = report ? report.learning : e.learning.map(l => ({ ...l, resources: [] }));
  const missed = report ? report.missed : e.missed;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10" data-testid="iv-results">
      <Card className="p-6 md:p-8 text-center fade-up" glow>
        <div className={`text-xs font-mono uppercase tracking-wider ${st.text} mb-3`}>{INTERVIEW_CATEGORY_BY_ID[e.category].label} · {INTERVIEW_LEVEL_LABEL[lvl]} · {e.careerName}</div>
        <ScoreRing score={e.overall} size={130} label="Overall" />
        <h3 className="font-display text-xl font-semibold mt-4" data-testid="iv-verdict">{e.overall >= 75 ? "Interview-ready on this topic" : e.overall >= 50 ? "Promising — a few gaps to close" : "Needs more preparation"}</h3>
        <p className="text-xs text-mute mt-1">{e.answered}/{e.total} answered · {fmtClock(e.timeSec)} of {fmtClock(e.limitSec)}{report && report.timedOut ? " · time ran out" : ""}</p>
        {delta !== null && <p className="text-xs text-mute mt-1">{delta > 0 ? `▲ ${delta} points up` : delta < 0 ? `▼ ${-delta} points down` : "Same score"} vs your previous {INTERVIEW_LEVEL_LABEL[lvl]} {INTERVIEW_CATEGORY_BY_ID[e.category].label} interview ({prev.overall}%).</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-left">
          <ScoreBar label="Technical knowledge" score={e.scores.technical} /><ScoreBar label="Problem-solving" score={e.scores.problemSolving} />
          <ScoreBar label="Communication clarity" score={e.scores.communication} /><ScoreBar label="Practical understanding" score={e.scores.practical} />
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <Card className="p-5"><h4 className="font-display font-medium mb-3">Category-wise performance</h4>
          <div className="space-y-2.5" data-testid="iv-topics">{topics.map(t => (<div key={t.topic}><div className="flex justify-between text-xs mb-1"><span>{t.topic}</span><span className="font-mono text-mute">{t.pct}%</span></div><div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.pct >= 70 ? "#22C55E" : t.pct >= 50 ? "#F59E0B" : "#F43F5E" }} /></div></div>))}</div></Card>
        <Card className="p-5"><h4 className="font-display font-medium mb-3">Strengths & weaknesses</h4>
          <div className="text-xs text-mute mb-1">Strong areas</div><div className="flex flex-wrap gap-1.5 mb-3">{e.strong.length ? e.strong.map(t => <Badge key={t} tone="good">{t}</Badge>) : <span className="text-xs text-mute">None yet — keep practising.</span>}</div>
          <div className="text-xs text-mute mb-1">Weak areas</div><div className="flex flex-wrap gap-1.5">{e.weak.length ? e.weak.map(t => <Badge key={t} tone="bad">{t}</Badge>) : <span className="text-xs text-mute">No weak areas in this round.</span>}</div></Card>
      </div>
      {missed.length > 0 && (<Card className="p-5 mt-5" data-testid="iv-missed"><h4 className="font-display font-medium mb-3">Missed concepts</h4>
        <ul className="text-sm text-mute space-y-1.5">{missed.slice(0, 10).map((m, i) => <li key={i}><b className="text-ink">{m.concept}</b>{m.topic ? <span className="text-[11px] font-mono ml-2">{m.topic}</span> : null}{m.hint ? <span> — {m.hint}</span> : null}</li>)}</ul></Card>)}
      {learning.length > 0 && (<Card className="p-5 mt-5 !bg-indigo/5 border-indigo/25" data-testid="iv-learning"><h4 className="font-display font-medium mb-3">Recommended learning topics</h4>
        <div className="space-y-3">{learning.map((l, i) => (<div key={i} className="text-sm"><b>{l.topic}</b> <span className="text-mute">— {l.why}</span>{l.resources && l.resources.length > 0 && <ul className="text-xs text-mute list-disc pl-5 mt-1">{l.resources.slice(0, 2).map((r, k) => <li key={k}>{r}</li>)}</ul>}</div>))}</div></Card>)}
      <Card className="p-5 mt-5"><h4 className="font-display font-medium mb-3">Question-by-question feedback</h4><IVQuestionReview items={e.questions} /></Card>
      <p className="text-xs text-mute mt-4">Scores come from a transparent rubric (concept coverage, reasoning, structure, examples). Interview results are one evidence source in your Career Digital Twin — a Basic round counts for less than an Advanced one, and interviews never replace GitHub, resume, assessment or project evidence.</p>
      <div className="flex flex-wrap gap-3 mt-6"><Button variant="secondary" onClick={onRetry} data-testid="iv-retry">Retry with fresh questions</Button><Button onClick={onBack} iconRight="arrow-right" data-testid="iv-back">Back to interviews</Button></div>
    </div>
  );
}

function InterviewAnalytics({ history }) {
  const rep = interviewRepeatedWeaknesses(history);
  const byCat = {}; history.forEach(h => { (byCat[h.category] = byCat[h.category] || []).push(h); });
  const last = history.slice(-10);
  const trend = history.length >= 2 ? history[history.length - 1].overall - history[0].overall : null;
  return (
    <Card className="p-5 md:p-6 mt-8" data-testid="iv-analytics">
      <div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg font-medium">Your progress</h3>{trend !== null && <Badge tone={trend >= 0 ? "good" : "warn"}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)} pts since first interview</Badge>}</div>
      <div className="flex items-end gap-1.5 h-24 mb-5" aria-label="Recent interview scores">
        {last.map(h => (<div key={h.id} className="flex-1 flex flex-col items-center justify-end h-full" title={`${INTERVIEW_CATEGORY_BY_ID[h.category].label} ${INTERVIEW_LEVEL_LABEL[h.level]}: ${h.overall}%`}>
          <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, h.overall)}%`, background: LEVEL_STYLE[h.level].bar }} /><span className="text-[9px] font-mono text-mute mt-1">{h.overall}</span></div>))}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><div className="text-xs font-mono text-mute uppercase mb-2">Average by category</div>
          <div className="space-y-2">{Object.keys(byCat).map(k => { const a = Math.round(byCat[k].reduce((s, h) => s + h.overall, 0) / byCat[k].length); return <ScoreBar key={k} label={`${INTERVIEW_CATEGORY_BY_ID[k].label} (${byCat[k].length})`} score={a} />; })}</div></div>
        <div><div className="text-xs font-mono text-mute uppercase mb-2">Repeated weaknesses</div>
          {rep.length ? <ul className="text-sm text-mute space-y-1">{rep.map(r => <li key={r.concept}><b className="text-ink">{r.concept}</b> <span className="text-[11px] font-mono">missed in {r.count} interviews</span></li>)}</ul> : <p className="text-xs text-mute">No concept has been missed more than once yet.</p>}</div>
      </div>
    </Card>
  );
}

function InterviewHistory({ history, onView, onRetry }) {
  const [filter, setFilter] = useState("all");
  const rows = history.slice().reverse().filter(h => filter === "all" || h.category === filter);
  if (!history.length) return <Card className="p-8 text-center text-sm text-mute" data-testid="iv-history-empty">No interviews yet — complete one and it will appear here with full feedback.</Card>;
  return (
    <div data-testid="iv-history">
      <div className="flex flex-wrap gap-2 mb-4">{[["all", "All"], ...INTERVIEW_CATEGORIES.map(c => [c.id, c.label])].map(([k, l]) => (
        <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1.5 rounded-full border ${filter === k ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute"}`}>{l}</button>))}</div>
      <div className="space-y-3">
        {rows.map(h => (
          <Card key={h.id} className="p-4 flex flex-wrap items-center gap-3" data-history-row={h.id}>
            <div className="flex-1 min-w-[200px]"><div className="text-sm font-medium">{INTERVIEW_CATEGORY_BY_ID[h.category].label} · <span className={LEVEL_STYLE[h.level].text}>{INTERVIEW_LEVEL_LABEL[h.level]}</span></div>
              <div className="text-xs text-mute">{h.careerName} · {new Date(h.at).toLocaleString()} · {h.answered}/{h.total} answered</div></div>
            <Badge tone={h.overall >= 70 ? "good" : h.overall >= 45 ? "warn" : "bad"}>{h.overall}%</Badge>
            <Button size="sm" variant="secondary" onClick={() => onView(h)} data-view={h.id}>View feedback</Button>
            <Button size="sm" variant="ghost" onClick={() => onRetry(h)}>Retry</Button>
          </Card>))}
      </div>
    </div>
  );
}
