// ============================================================================
// PROOF-OF-SKILL PROJECT PLATFORM
// Components: ProjectDashboard (Projects), ProjectSearch, ProjectFilters, ProjectCatalogue, ProjectCard,
// RecommendedProject, ProjectDetails, ProjectWorkspace, ProjectTaskManager, AIProjectMentor,
// ProjectSubmission, ProjectVerification, ProjectEvaluation, ProjectHistory.
// ============================================================================
const pjSel = "bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-indigo/60 w-full";
const pjIn = "w-full bg-panel2 border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/60 focus:outline-none focus:border-indigo/60";
const PJ_LV_TONE = { basic: "good", intermediate: "indigo", advanced: "warn" };
const PJ_STATUS_META = {
  "not-started": { label: "Not started", tone: "mute" }, "in-progress": { label: "In progress", tone: "cyan" },
  "self-reported": { label: "Self-reported", tone: "warn" }, submitted: { label: "Evidence submitted", tone: "indigo" }, verified: { label: "Verified", tone: "good" },
};
const pjDate = (iso) => { try { return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""; } catch (e) { return ""; } };
const PJ_TABS = [["recommended", "Recommended"], ["all", "All projects"], ["career", "Career-based"], ["basic", "Basic"], ["intermediate", "Intermediate"], ["advanced", "Advanced"], ["recent", "Recently viewed"], ["progress", "In-progress"], ["completed", "Completed"]];
const PJ_PAGE = 24;

async function pjBrowserFetchJson(path) {
  let r;
  try { r = await fetch("https://api.github.com" + path, { headers: { Accept: "application/vnd.github+json" } }); }
  catch (e) { const er = new Error("Could not reach GitHub from the browser (offline or blocked)."); er.status = 0; throw er; }
  if (!r.ok) { const er = new Error(r.status === 404 ? "Repository not found (it must be public)." : r.status === 403 || r.status === 429 ? "GitHub API rate limit reached — try again later (unauthenticated limit is 60/hour)." : "GitHub returned " + r.status); er.status = r.status; throw er; }
  return r.json();
}
async function pjCheckUrl(url) {
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000); await fetch(url, { mode: "no-cors", signal: c.signal }); clearTimeout(t); return true; } catch (e) { return false; }
}
// Runs a submission: server-side analysis when the backend is available, otherwise live GitHub analysis in the browser.
async function pjRunSubmission(p, sub, ctx) {
  const parsed = parseRepoUrl(sub.repoUrl);
  let evaluation = null, note = "";
  if (parsed) {
    if (API.available && API.token) {
      try { const r = await API.request("POST", `/api/projects/${p.id}/submit`, { submission: sub, startedAt: ctx.startedAt }); evaluation = r.evaluation; }
      catch (e) { note = "Server analysis unavailable (" + e.message + "); trying GitHub from your browser."; }
    }
    if (!evaluation) {
      try {
        const ev = await fetchRepoEvidence(parsed.owner, parsed.repo, pjBrowserFetchJson);
        evaluation = evaluateSubmission(p, ev, { githubUsername: ctx.githubUsername, submission: sub, startedAt: ctx.startedAt, verifiedBy: "browser" });
        if (API.available && API.token && evaluation.verification.status === "verified") // signed-in accounts: only the server can verify
          evaluation.verification = { ...evaluation.verification, status: "submitted", verifiedBy: null, reasons: ["The server could not analyse the repository, so this browser-side result is recorded as submitted. Resubmit when the server is reachable to be verified."] };
      }
      catch (e) { note = (note ? note + " " : "") + "Repository analysis failed: " + e.message; }
    }
  } else if (sub.repoUrl) note = "That does not look like a GitHub repository URL (https://github.com/owner/repo).";
  if (!evaluation) { evaluation = evaluateEvidenceOnly(p, sub, ctx); evaluation.analysisNote = note || "No repository supplied."; }
  else if (note) evaluation.analysisNote = note;
  if (sub.deployUrl && /^https?:\/\//i.test(sub.deployUrl)) {
    const live = await pjCheckUrl(sub.deployUrl);
    evaluation.flags = [...(evaluation.flags || []), { level: live ? "info" : "warn", text: live ? "Deployment URL responded from your browser (reachability only; content is not inspected)." : "Deployment URL did not respond from your browser." }];
  }
  return evaluation;
}

// ----------------------------- small building blocks -------------------------
function ProjectStatusBadge({ status }) { const m = PJ_STATUS_META[status] || PJ_STATUS_META["not-started"]; return <Badge tone={m.tone}>{m.label}</Badge>; }
function LevelBadge({ level }) { return <Badge tone={PJ_LV_TONE[level]}>{PJ_LEVEL_LABEL[level]}</Badge>; }

function ProjectSearch({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"><Icon name="search" size={16} /></span>
      <input data-testid="project-search" className={pjIn + " pl-10"} value={value} onChange={e => onChange(e.target.value)} placeholder="Search projects by career, technology, skill or project name..." aria-label="Search projects" />
    </div>
  );
}

function ProjectFilters({ filters, setFilters, careers, hideLevel }) {
  const opts = useMemo(() => {
    const uniq = (f) => [...new Set(PROJECTS.flatMap(f))].sort((a, b) => a.localeCompare(b));
    return { langs: uniq(p => p.languages), stacks: uniq(p => [...p.frameworks, ...p.databases, ...p.tools]).slice(0, 400), skills: uniq(p => p.skills).sort((a, b) => pjSkillName(a).localeCompare(pjSkillName(b))), durations: [...new Set(PROJECTS.map(p => p.duration))] };
  }, []);
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const active = Object.keys(filters).filter(k => k !== "q" && filters[k]).length;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono uppercase tracking-widest text-mute flex items-center gap-2"><Icon name="filter" size={14} /> Filters {active > 0 && <Badge tone="indigo">{active}</Badge>}</div>
        {active > 0 && <button className="text-xs text-cyan hover:underline" onClick={() => setFilters({ q: filters.q })}>Clear filters</button>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select aria-label="Career role" className={pjSel} value={filters.role || ""} onChange={set("role")}><option value="">Any career role</option>{careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Category" className={pjSel} value={filters.category || ""} onChange={set("category")}><option value="">Any category</option>{PROJECT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        {!hideLevel && <select aria-label="Difficulty" className={pjSel} value={filters.level || ""} onChange={set("level")}><option value="">Any difficulty</option>{PJ_LEVELS.map(l => <option key={l} value={l}>{PJ_LEVEL_LABEL[l]}</option>)}</select>}
        <select aria-label="Language" className={pjSel} value={filters.lang || ""} onChange={set("lang")}><option value="">Any language</option>{opts.langs.map(l => <option key={l}>{l}</option>)}</select>
        <select aria-label="Stack" className={pjSel} value={filters.stack || ""} onChange={set("stack")}><option value="">Any framework / tool</option>{opts.stacks.map(l => <option key={l}>{l}</option>)}</select>
        <select aria-label="Duration" className={pjSel} value={filters.duration || ""} onChange={set("duration")}><option value="">Any duration</option>{opts.durations.map(l => <option key={l}>{l}</option>)}</select>
        <select aria-label="Required skill" className={pjSel} value={filters.skill || ""} onChange={set("skill")}><option value="">Any required skill</option>{opts.skills.map(l => <option key={l} value={l}>{pjSkillName(l)}</option>)}</select>
        <select aria-label="Status" className={pjSel} value={filters.status || ""} onChange={set("status")}><option value="">Any status</option>{Object.keys(PJ_STATUS_META).map(k => <option key={k} value={k}>{PJ_STATUS_META[k].label}</option>)}</select>
      </div>
    </Card>
  );
}

function ProjectCard({ p, entry, reasons, score, onOpen, skillState, tag }) {
  const status = projectStatus({ [p.id]: entry }, p.id); const prog = entry ? projectProgress(p, entry) : null;
  return (
    <Card className="p-5 flex flex-col hover:border-indigo/40 transition-colors" data-testid="project-card">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap"><LevelBadge level={p.level} />{tag && <Badge tone="cyan">{tag}</Badge>}</div>
        {score != null ? <span className="text-xs font-mono text-cyan">{score}% match</span> : <ProjectStatusBadge status={status} />}
      </div>
      <h3 className="font-display font-medium text-lg leading-snug">{p.name}</h3>
      <div className="text-xs text-mute mt-0.5">{p.categoryName} · {p.duration}</div>
      <p className="text-sm text-mute mt-2 line-clamp-3 flex-1">{p.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">{p.skills.slice(0, 4).map(s => <span key={s} className="chip px-2 py-0.5 rounded-full text-[11px] text-mute">{pjSkillName(s)}</span>)}{p.skills.length > 4 && <span className="text-[11px] text-mute">+{p.skills.length - 4}</span>}</div>
      {reasons && <ul className="mt-3 space-y-1">{reasons.slice(0, 3).map((r, i) => <li key={i} className="text-xs text-mute flex gap-1.5"><span className="text-good">✓</span>{r}</li>)}</ul>}
      {prog && status !== "not-started" && <div className="mt-3"><ScoreBar label={`Progress ${prog.done}/${prog.total}`} score={prog.pct} size="sm" /></div>}
      <Button variant="secondary" size="sm" className="mt-4 w-full" iconRight="arrow-right" onClick={() => onOpen(p.id)} data-testid="open-project">{status === "not-started" ? "View project" : "Continue"}</Button>
    </Card>
  );
}

function RecommendedProject({ item, entry, onOpen }) {
  const p = item.project;
  return (
    <Card className="p-6 !bg-cyan/5 border-cyan/25" data-testid="recommended-top">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex gap-2 mb-2"><Badge tone="cyan">Top recommendation</Badge><LevelBadge level={p.level} /></div>
          <div className="font-display text-xl font-medium">{p.name}</div>
          <p className="text-sm text-mute mt-1 max-w-2xl">{p.description}</p>
          <div className="text-xs uppercase tracking-widest font-mono text-mute mt-4 mb-1.5">Why this project</div>
          <ul className="space-y-1">{item.reasons.map((r, i) => <li key={i} className="text-sm text-ink/90 flex gap-2"><span className="text-good">✓</span>{r}</li>)}</ul>
        </div>
        <div className="text-center"><ScoreRing score={item.score} size={96} stroke={8} label={item.score + "%"} sub="match" /><Button className="mt-3" size="sm" iconRight="arrow-right" onClick={() => onOpen(p.id)}>Open project</Button></div>
      </div>
    </Card>
  );
}

function ProjectCatalogue({ items, state, onOpen, skillState, more, onMore, total, empty }) {
  if (!items.length) return <Card><EmptyState icon="search" title={empty || "No projects match"} sub="Try removing a filter or searching a different technology." /></Card>;
  return (
    <div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="project-grid">{items.map(it => <ProjectCard key={it.p?.id || it.id} p={it.p || it} entry={state[(it.p || it).id]} reasons={it.reasons} score={it.score} tag={it.tag} onOpen={onOpen} skillState={skillState} />)}</div>
      {more && <div className="text-center mt-6"><Button variant="secondary" onClick={onMore}>Show more ({total - items.length} left)</Button></div>}
    </div>
  );
}

function ProjectHistory({ state, onOpen }) {
  const rows = Object.keys(state).filter(id => PROJECT_BY_ID[id] && ["self-reported", "submitted", "verified"].includes(state[id].status))
    .sort((a, b) => (state[b].updatedAt || "").localeCompare(state[a].updatedAt || ""));
  if (!rows.length) return <Card><EmptyState icon="award" title="Nothing completed yet" sub="Finish a project, submit your repository, and your evidence appears here with its verification status." /></Card>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]"><thead><tr className="text-left text-xs font-mono uppercase tracking-widest text-mute border-b border-line"><th className="p-4">Project</th><th className="p-4">Status</th><th className="p-4">Score</th><th className="p-4">Attempts</th><th className="p-4">Updated</th><th /></tr></thead>
        <tbody>{rows.map(id => { const e = state[id], p = PROJECT_BY_ID[id]; return (
          <tr key={id} className="border-b border-line/60 last:border-0" data-testid="history-row"><td className="p-4"><div className="font-medium">{p.name}</div><div className="text-xs text-mute">{p.categoryName} · {p.levelLabel}</div></td>
            <td className="p-4"><ProjectStatusBadge status={e.status} /></td><td className="p-4 font-mono">{e.evaluation ? e.evaluation.overall : "—"}</td><td className="p-4 font-mono">{(e.history || []).length || (e.evaluation ? 1 : 0)}</td>
            <td className="p-4 text-mute text-xs">{pjDate(e.updatedAt)}</td><td className="p-4 text-right"><Button size="sm" variant="ghost" onClick={() => onOpen(id)}>Open</Button></td></tr>); })}</tbody></table>
    </Card>
  );
}

// ----------------------------- details / workspace ---------------------------
function ProjectVerification({ entry }) {
  const st = projectStatus({ x: entry }, "x"); const steps = [["self-reported", "Self-reported", "You marked it complete. Nothing is verified."], ["submitted", "Evidence submitted", "You provided links/text. Evidence is recorded but not independently confirmed."], ["verified", "Independently verified", "Your public repository was analysed live: ownership, originality and required skills were checked."]];
  const rank = { "not-started": -1, "in-progress": -1, "self-reported": 0, submitted: 1, verified: 2 }[st];
  return (
    <Card className="p-5" data-testid="verification-ladder">
      <div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Verification ladder</div>
      <div className="grid md:grid-cols-3 gap-3">{steps.map((s, i) => (
        <div key={s[0]} className={`rounded-xl border p-3 ${i <= rank ? (i === 2 ? "border-good/50 bg-good/10" : "border-indigo/40 bg-indigo/10") : "border-line opacity-60"}`}>
          <div className="text-sm font-medium flex items-center gap-2">{i <= rank ? <span className="text-good">●</span> : <span className="text-mute">○</span>}{s[1]}</div><p className="text-xs text-mute mt-1">{s[2]}</p></div>))}</div>
      <p className="text-xs text-mute mt-3">Only <b>verified</b> projects add skill evidence to your Digital Twin, and only for skills actually detected in your code.</p>
    </Card>
  );
}

function ProjectTaskManager({ p, ws, entry, update }) {
  const [open, setOpen] = useState(() => ws.phases[0].id);
  const tasks = entry?.tasks || {};
  const toggle = (id) => update(e => ({ ...e, tasks: { ...e.tasks, [id]: !e.tasks?.[id] ? true : undefined } }));
  return (
    <div className="space-y-3" data-testid="task-manager">
      {ws.phases.map((ph, pi) => { const done = ph.tasks.filter(t => tasks[t.id]).length; const isOpen = open === ph.id; return (
        <Card key={ph.id} className="overflow-hidden">
          <button className="w-full flex items-center justify-between gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : ph.id)} aria-expanded={isOpen}>
            <div><div className="text-xs font-mono text-cyan">PHASE {pi + 1}</div><div className="font-display font-medium">{ph.title}</div><div className="text-xs text-mute">{ph.goal}</div></div>
            <div className="flex items-center gap-3"><span className={`text-sm font-mono ${done === ph.tasks.length ? "text-good" : "text-mute"}`}>{done}/{ph.tasks.length}</span><Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} /></div>
          </button>
          {isOpen && <div className="border-t border-line divide-y divide-line/60">{ph.tasks.map(t => (
            <label key={t.id} className="flex gap-3 p-4 cursor-pointer hover:bg-white/[0.02]">
              <input type="checkbox" className="mt-1 accent-indigo w-4 h-4" checked={!!tasks[t.id]} onChange={() => toggle(t.id)} data-testid={"task-" + t.id} />
              <div><div className={`text-sm font-medium ${tasks[t.id] ? "line-through text-mute" : ""}`}>{t.title}</div><p className="text-xs text-mute mt-1">{t.detail}</p>{t.hint && <p className="text-xs text-cyan mt-1.5">💡 {t.hint}</p>}</div>
            </label>))}</div>}
        </Card>); })}
    </div>
  );
}

function CheckList({ title, items, entry, update }) {
  return (
    <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">{title}</div>
      <div className="space-y-2">{items.map(c => (<label key={c.id} className="flex gap-2.5 text-sm cursor-pointer"><input type="checkbox" className="mt-1 accent-indigo" checked={!!entry?.checks?.[c.id]} onChange={() => update(e => ({ ...e, checks: { ...e.checks, [c.id]: !e.checks?.[c.id] ? true : undefined } }))} /><span className={entry?.checks?.[c.id] ? "text-mute line-through" : ""}>{c.text}</span></label>))}</div></Card>
  );
}

function ProjectWorkspace({ p, ws, entry, update, setTab }) {
  const prog = projectProgress(p, entry);
  const status = projectStatus({ x: entry }, "x");
  return (
    <div className="space-y-5" data-testid="workspace">
      <Card className="p-5 flex items-center gap-6 flex-wrap">
        <ScoreRing score={prog.pct} size={96} stroke={8} label={prog.pct + "%"} sub="done" />
        <div className="flex-1 min-w-[220px]">
          <div className="font-display font-medium">{prog.done} of {prog.total} tasks · {prog.checksDone}/{prog.checksTotal} checklist items</div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">{ws.phases.map((ph, i) => <ScoreBar key={ph.id} size="sm" label={ph.title} score={prog.phases[i].total ? Math.round(100 * prog.phases[i].done / prog.phases[i].total) : 0} />)}</div>
        </div>
        <div className="flex flex-col gap-2 min-w-[180px]">
          {entry?.paused ? <Button size="sm" icon="play" onClick={() => update(e => ({ ...e, paused: false }))}>Resume</Button> : <Button size="sm" variant="secondary" onClick={() => update(e => ({ ...e, paused: true }))}>Pause project</Button>}
          <Button size="sm" variant="secondary" disabled={status === "submitted" || status === "verified"} onClick={() => update(e => ({ ...e, status: "self-reported" }))} data-testid="mark-complete">Mark complete (self-reported)</Button>
          <div className="text-[11px] text-mute text-center">{entry?.paused ? "Paused · " : ""}Auto-saved {entry?.updatedAt ? pjDate(entry.updatedAt) : "—"}</div>
        </div>
      </Card>
      {status === "self-reported" && <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">Self-reported completion does not verify any skill. Submit your repository in the Submission tab to earn verified evidence.</div>}
      <ProjectTaskManager p={p} ws={ws} entry={entry} update={update} />
      <div className="grid md:grid-cols-2 gap-4"><CheckList title="Testing checklist" items={ws.testChecklist} entry={entry} update={update} /><CheckList title="Deployment checklist" items={ws.deployChecklist} entry={entry} update={update} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Repository structure to fill in</div><pre className="text-xs text-cyan/90 whitespace-pre-wrap font-mono leading-relaxed">{ws.repoStructure.join("\n")}</pre><p className="text-xs text-mute mt-3">A skeleton only — the implementation is yours.</p></Card>
        <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Code guidance</div><ul className="space-y-2">{ws.codeGuidance.map((g, i) => <li key={i} className="text-sm text-mute">• {g}</li>)}</ul><Button size="sm" variant="ghost" className="mt-3" onClick={() => setTab("mentor")}>Ask the AI mentor →</Button></Card>
      </div>
      <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-2">Project notes & documentation draft</div>
        <textarea className={pjIn + " min-h-[110px]"} value={entry?.notes || ""} onChange={e => update(x => ({ ...x, notes: e.target.value.slice(0, 4000) }))} placeholder="Decisions, problems you hit, links to docs… (saved automatically)" data-testid="notes" /></Card>
    </div>
  );
}

function ProjectDetails({ p, ws, skillState, state, onOpen, career }) {
  const roles = projectRoles(p).slice(0, 8).map(id => CAREER_BY_ID[id]?.name).filter(Boolean);
  const List = ({ items }) => <ul className="space-y-1.5">{items.map((x, i) => <li key={i} className="text-sm text-mute flex gap-2"><span className="text-cyan">›</span>{x}</li>)}</ul>;
  const Sec = ({ t, children }) => <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">{t}</div>{children}</Card>;
  return (
    <div className="space-y-4" data-testid="details">
      <Sec t="Real-world problem"><p className="text-sm text-ink/90">{p.problem}</p><div className="mt-3"><List items={p.applications} /></div></Sec>
      <div className="grid md:grid-cols-2 gap-4"><Sec t="Learning objectives"><List items={p.objectives} /></Sec>
        <Sec t="Required skills"><div className="space-y-2">{p.skills.map(s => { const c = skillState?.[s]?.score; return <div key={s} className="flex items-center justify-between text-sm"><span>{pjSkillName(s)}</span><span className="text-xs text-mute font-mono">{c != null ? `${Math.round(c)}% evidence` : "not in your role"}</span></div>; })}</div></Sec></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Sec t="Technology stack"><div className="space-y-1.5 text-sm">{[["Languages", p.languages], ["Frameworks", p.frameworks], ["Databases", p.databases], ["Tools", p.tools]].map(([k, v]) => v.length ? <div key={k}><span className="text-mute">{k}: </span>{v.join(", ")}</div> : null)}<div><span className="text-mute">Duration: </span>{p.duration} (~{p.hours}h) · <span className="text-mute">Complexity: </span>{p.complexity}/10</div></div></Sec>
        <Sec t="Prerequisites">{p.prerequisites.skills.length || p.prerequisites.projects.length ? <><List items={p.prerequisites.skills.map(pjSkillName)} />{p.prerequisites.projects.length > 0 && <div className="mt-3 text-xs text-mute">Recommended first: {p.prerequisites.projects.map(id => <button key={id} className="text-cyan hover:underline mr-2" onClick={() => onOpen(id)}>{PROJECT_BY_ID[id].name}</button>)}</div>}</> : <p className="text-sm text-mute">None — a good starting point.</p>}</Sec>
      </div>
      <Sec t="System architecture"><div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: ws.architectureSvg }} /></Sec>
      <Sec t="Workflow"><div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: ws.workflowSvg }} /></Sec>
      {ws.schema && <div className="grid md:grid-cols-2 gap-4"><Sec t="Database schema (starting point)"><pre className="text-xs text-cyan/90 whitespace-pre-wrap font-mono">{ws.schema}</pre></Sec>
        <Sec t="API design"><div className="space-y-1.5">{ws.api.map((a, i) => <div key={i} className="text-xs font-mono"><span className="text-good">{a[0]}</span> <span>{a[1]}</span> <span className="text-mute">— {a[2]}</span></div>)}</div></Sec></div>}
      <Sec t="Implementation phases"><ol className="space-y-2">{ws.phases.map((ph, i) => <li key={ph.id} className="text-sm"><span className="font-mono text-cyan mr-2">{i + 1}.</span><b>{ph.title}</b> <span className="text-mute">— {ph.goal} ({ph.tasks.length} tasks)</span></li>)}</ol></Sec>
      <div className="grid md:grid-cols-2 gap-4"><Sec t="Testing requirements"><List items={ws.testChecklist.map(c => c.text)} /></Sec><Sec t="Deployment requirements"><List items={ws.deployChecklist.map(c => c.text)} /></Sec></div>
      <div className="grid md:grid-cols-2 gap-4"><Sec t="Deliverables"><List items={p.deliverables} /></Sec>
        <Sec t="Evaluation criteria">{p.evaluation.map(c => <div key={c.label} className="flex justify-between text-sm py-0.5"><span className="text-mute">{c.label}</span><span className="font-mono">{c.weight}%</span></div>)}</Sec></div>
      <div className="grid md:grid-cols-2 gap-4"><Sec t="Relevant career roles"><div className="flex flex-wrap gap-1.5">{roles.map(r => <span key={r} className="chip px-2.5 py-1 rounded-full text-xs">{r}</span>)}</div></Sec>
        <Sec t="Related projects">{p.related.length ? <div className="space-y-1.5">{p.related.map(id => <button key={id} onClick={() => onOpen(id)} className="block text-left text-sm text-cyan hover:underline">{PROJECT_BY_ID[id].name} <span className="text-mute text-xs">({PJ_LEVEL_LABEL[PROJECT_BY_ID[id].level]})</span></button>)}</div> : <p className="text-sm text-mute">—</p>}</Sec></div>
    </div>
  );
}

function AIProjectMentor({ p, entry, update }) {
  const [text, setText] = useState(""); const endRef = useRef(null);
  const log = entry?.mentorLog || [];
  const ask = (q) => {
    const msg = (q ?? text).trim(); if (!msg) return;
    const r = projectMentorReply(p, msg, { entry });
    update(e => ({ ...e, mentorLog: [...(e.mentorLog || []), { role: "user", text: msg }, { role: "mentor", title: r.title, text: JSON.stringify(r) }].slice(-30) }));
    setText("");
  };
  useEffect(() => { endRef.current && endRef.current.scrollIntoView && endRef.current.scrollIntoView({ block: "nearest" }); }, [log.length]);
  const quick = ["Explain the requirements", "Explain the architecture", "What should I do next?", "Explain " + pjSkillName(p.skills[0]), "Help me with the README", "How do I improve this?"];
  return (
    <Card className="p-5" data-testid="mentor">
      <div className="flex items-center gap-2 mb-1"><Icon name="bot" size={18} /><div className="font-display font-medium">AI Project Mentor</div><Badge tone="mute">rule-based · teaches, doesn't write your project</Badge></div>
      <div className="flex flex-wrap gap-2 my-3">{quick.map(q => <Chip key={q} onClick={() => ask(q)}>{q}</Chip>)}</div>
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1" data-testid="mentor-log">
        {!log.length && <p className="text-sm text-mute">Ask about requirements, architecture, a technology, an error you hit, or paste code to have it explained and reviewed.</p>}
        {log.map((m, i) => { if (m.role === "user") return <div key={i} className="ml-auto max-w-[85%] rounded-xl bg-indigo/20 border border-indigo/30 px-3.5 py-2 text-sm whitespace-pre-wrap">{m.text}</div>;
          let r; try { r = JSON.parse(m.text); } catch (e) { r = { title: m.title, paragraphs: [m.text], bullets: [], questions: [], resources: [] }; }
          return (<div key={i} className="max-w-[92%] rounded-xl bg-panel2 border border-line px-4 py-3 text-sm space-y-2" data-testid="mentor-reply">
            <div className="font-medium text-cyan">{r.title}</div>
            {r.paragraphs.map((x, j) => <p key={j} className="text-ink/90">{x}</p>)}
            {r.bullets.length > 0 && <ul className="space-y-1">{r.bullets.map((x, j) => <li key={j} className="text-mute">• {x}</li>)}</ul>}
            {r.resources.length > 0 && <div><div className="text-xs font-mono uppercase text-mute">Study</div>{r.resources.map((x, j) => <div key={j} className="text-mute">📖 {x}</div>)}</div>}
            {r.questions.length > 0 && <div className="border-t border-line pt-2"><div className="text-xs font-mono uppercase text-mute mb-1">Think about</div>{r.questions.map((x, j) => <div key={j} className="text-amber-200/90">? {x}</div>)}</div>}
          </div>); })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 mt-4 items-end">
        <textarea className={pjIn + " min-h-[44px] max-h-40"} rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Ask a question, paste an error, or paste code to review…" data-testid="mentor-input"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} />
        <Button icon="send" onClick={() => ask()} data-testid="mentor-send" aria-label="Send">Ask</Button>
      </div>
    </Card>
  );
}

function ProjectSubmission({ p, entry, update, profile, ctx, onDone }) {
  const sub0 = entry?.submission || {};
  const [f, setF] = useState({ repoUrl: sub0.repoUrl || "", deployUrl: sub0.deployUrl || "", videoUrl: sub0.videoUrl || "", docsText: sub0.docsText || "", testResults: sub0.testResults || "", shots: (sub0.screenshots || []).join("\n"), notes: sub0.notes || "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setErr(""); if (!f.repoUrl.trim() && !f.docsText.trim() && !f.testResults.trim() && !f.deployUrl.trim()) { setErr("Provide at least a GitHub repository URL (needed for verification) or some evidence."); return; }
    setBusy(true);
    const sub = { repoUrl: f.repoUrl.trim(), deployUrl: f.deployUrl.trim(), videoUrl: f.videoUrl.trim(), docsText: f.docsText.slice(0, 6000), testResults: f.testResults.slice(0, 3000), screenshots: f.shots.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 8), notes: f.notes.slice(0, 1000), submittedAt: pjNow() };
    try {
      const ev = await pjRunSubmission(p, sub, { githubUsername: profile.githubUsername, startedAt: entry?.startedAt, submission: sub });
      update(e => {
        const st = e.status === "verified" && ev.verification.status !== "verified" ? "submitted" : ev.verification.status; // resubmission can downgrade
        return { ...e, status: st, submission: sub, evaluation: ev, history: [...(e.history || []), { at: ev.at, overall: ev.overall, status: ev.verification.status, mode: ev.mode }].slice(-10) };
      });
      onDone();
    } catch (e) { setErr("Submission failed: " + e.message); }
    setBusy(false);
  };
  return (
    <Card className="p-6" data-testid="submission">
      <div className="font-display font-medium text-lg">Submit evidence</div>
      <p className="text-sm text-mute mt-1 mb-4">Provide a <b>public GitHub repository</b> to be eligible for independent verification. Other evidence is recorded and scored, but is self-provided and can never reach “verified” on its own. You can resubmit as often as you like.</p>
      {!profile.githubUsername && <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn mb-4">Add your GitHub username in Profile → Settings so SkillPilot can confirm the repository is yours.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block md:col-span-2"><span className="text-xs text-mute">GitHub repository URL *</span><input className={pjIn + " mt-1"} placeholder="https://github.com/your-username/your-project" value={f.repoUrl} onChange={set("repoUrl")} data-testid="repo-url" /></label>
        <label className="block"><span className="text-xs text-mute">Deployment URL (optional)</span><input className={pjIn + " mt-1"} placeholder="https://your-app.example.com" value={f.deployUrl} onChange={set("deployUrl")} /></label>
        <label className="block"><span className="text-xs text-mute">Demo video URL (optional)</span><input className={pjIn + " mt-1"} placeholder="https://youtu.be/…" value={f.videoUrl} onChange={set("videoUrl")} /></label>
        <label className="block md:col-span-2"><span className="text-xs text-mute">Screenshot links, one per line (optional)</span><textarea className={pjIn + " mt-1"} rows={2} value={f.shots} onChange={set("shots")} /></label>
        <label className="block"><span className="text-xs text-mute">Test results (paste output, e.g. “24 passed, coverage 82%”)</span><textarea className={pjIn + " mt-1"} rows={4} value={f.testResults} onChange={set("testResults")} /></label>
        <label className="block"><span className="text-xs text-mute">Documentation / report text (optional)</span><textarea className={pjIn + " mt-1"} rows={4} value={f.docsText} onChange={set("docsText")} /></label>
      </div>
      {err && <div className="text-sm text-bad mt-3" role="alert">{err}</div>}
      <div className="flex items-center gap-3 mt-5"><Button onClick={submit} disabled={busy} icon={busy ? "refresh" : "upload"} data-testid="submit-evidence">{busy ? "Analysing repository…" : entry?.evaluation ? "Resubmit & re-evaluate" : "Submit & analyse"}</Button>
        <span className="text-xs text-mute">The repository is read through GitHub's public API; code is analysed, never executed.</span></div>
    </Card>
  );
}

function ProjectEvaluation({ p, entry, setTab }) {
  const ev = entry?.evaluation;
  if (!ev) return <Card><EmptyState icon="clipboard" title="No evaluation yet" sub="Submit your repository or evidence to receive a detailed, evidence-based report." action={<Button onClick={() => setTab("submit")}>Go to submission</Button>} /></Card>;
  const v = ev.verification; const tone = v.status === "verified" ? "good" : "indigo";
  const SK = { detected: ["good", "Detected in code"], mentioned: ["warn", "Mentioned only"], missing: ["bad", "Not found"], unassessed: ["mute", "Not automatically checkable"] };
  return (
    <div className="space-y-4" data-testid="evaluation">
      <Card className="p-6 flex flex-wrap gap-6 items-center">
        <ScoreRing score={ev.overall} size={120} label={String(ev.overall)} sub="overall" />
        <div className="flex-1 min-w-[240px]"><div className="flex items-center gap-2 flex-wrap"><Badge tone={tone}>{v.status === "verified" ? "Independently verified" : "Evidence submitted — not verified"}</Badge><Badge tone="mute">{ev.mode === "repository" ? "Repository analysed: " + (ev.repo || "") : "Evidence only"}</Badge></div>
          <ul className="mt-3 space-y-1">{v.reasons.map((r, i) => <li key={i} className="text-sm text-mute">{v.status === "verified" ? "✓" : "•"} {r}</li>)}</ul>
          {ev.analysisNote && <p className="text-xs text-warn mt-2">{ev.analysisNote}</p>}
          <p className="text-[11px] text-mute mt-2">{v.note || "Automated checks of submitted evidence."} Evaluated {pjDate(ev.at)}.</p></div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3"><div className="text-xs font-mono uppercase tracking-widest text-mute">Scores</div>
          {[["Completion", ev.completion], ["Technical quality", ev.technical], ["Code quality", ev.codeQuality], ["Architecture quality", ev.architecture], ["Required-skill coverage", ev.coverage], ["Testing", ev.testing], ["Documentation", ev.docs], ["Deployment", ev.deployment], ["Originality indicators", ev.originality]].map(([l, s]) => <ScoreBar key={l} label={l} score={s} />)}</Card>
        <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Required skills</div>
          <div className="space-y-2">{ev.skills.map(s => <div key={s.id} className="flex items-center justify-between gap-2 text-sm"><span>{s.name}</span><Badge tone={SK[s.state][0]}>{SK[s.state][1]}</Badge></div>)}</div>
          <p className="text-[11px] text-mute mt-3">Only “Detected” skills can become verified evidence in your Digital Twin.</p></Card>
      </div>
      {ev.requirements.length > 0 && <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Requirements ({ev.requirements.filter(r => r.met).length}/{ev.requirements.length} met)</div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">{ev.requirements.map(r => <div key={r.id} className="text-sm flex gap-2"><span className={r.met ? "text-good" : "text-bad"}>{r.met ? "✓" : "✗"}</span><div>{r.label}<div className="text-xs text-mute">{r.why}</div></div></div>)}</div></Card>}
      {ev.flags.length > 0 && <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Originality & integrity indicators</div>
        <div className="space-y-2">{ev.flags.map((f, i) => <div key={i} className={`text-sm flex gap-2 ${f.level === "red" ? "text-bad" : f.level === "warn" ? "text-warn" : "text-mute"}`}><span>{f.level === "red" ? "⛔" : f.level === "warn" ? "⚠" : "ℹ"}</span>{f.text}</div>)}</div></Card>}
      <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Improvement suggestions</div>
        {ev.suggestions.length ? <ul className="space-y-1.5">{ev.suggestions.map((s, i) => <li key={i} className="text-sm text-ink/90">→ {s}</li>)}</ul> : <p className="text-sm text-mute">No major gaps found.</p>}
        <Button className="mt-4" variant="secondary" size="sm" onClick={() => setTab("submit")} data-testid="resubmit">Improve and resubmit</Button></Card>
      {(entry.history || []).length > 1 && <Card className="p-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Attempt history</div>{entry.history.map((h, i) => <div key={i} className="flex justify-between text-sm py-1"><span className="text-mute">#{i + 1} · {pjDate(h.at)}</span><span className="font-mono">{h.overall} · {h.status}</span></div>)}</Card>}
    </div>
  );
}

function ProjectView({ p, entry, update, skillState, state, onOpen, onBack, profile, career }) {
  const [tab, setTab] = useState("overview"); const ws = projectWorkspace(p);
  const status = projectStatus({ x: entry }, "x"); const started = status !== "not-started";
  const T = [["overview", "Overview"], ["workspace", "Workspace"], ["mentor", "AI Mentor"], ["submit", "Submission"], ["results", "Evaluation"]];
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-10" data-testid="project-view">
      <button className="text-sm text-mute hover:text-ink mb-4 flex items-center gap-1" onClick={onBack} data-testid="back-to-projects"><Icon name="chevron-left" size={16} /> All projects</button>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div><div className="flex gap-2 mb-2"><LevelBadge level={p.level} /><Badge tone="mute">{p.categoryName}</Badge><ProjectStatusBadge status={status} /></div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">{p.name}</h1><p className="text-mute mt-1 max-w-3xl">{p.description}</p></div>
        {!started && <Button icon="play" onClick={() => { update(e => ({ ...e, status: "in-progress", startedAt: e.startedAt || pjNow() })); setTab("workspace"); }} data-testid="start-project">Start project</Button>}
      </div>
      <div className="mb-5"><ProjectVerification entry={entry} /></div>
      <div className="flex gap-2 flex-wrap mb-5" role="tablist">{T.map(([id, l]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{l}</Chip>)}</div>
      {tab === "overview" && <ProjectDetails p={p} ws={ws} skillState={skillState} state={state} onOpen={onOpen} career={career} />}
      {tab === "workspace" && (started ? <ProjectWorkspace p={p} ws={ws} entry={entry} update={update} setTab={setTab} /> : <Card><EmptyState icon="play" title="Start the project to open your workspace" sub="Your tasks, checklists and notes are saved automatically." action={<Button onClick={() => update(e => ({ ...e, status: "in-progress", startedAt: e.startedAt || pjNow() }))}>Start project</Button>} /></Card>)}
      {tab === "mentor" && <AIProjectMentor p={p} entry={entry} update={update} />}
      {tab === "submit" && <ProjectSubmission p={p} entry={entry} update={update} profile={profile} onDone={() => setTab("results")} />}
      {tab === "results" && <ProjectEvaluation p={p} entry={entry} setTab={setTab} />}
    </div>
  );
}

// ----------------------------- dashboard (page) ------------------------------
function Projects({ profile = {}, career, skillState, assessmentResults, githubData, resumeData, projectState = {}, setProjectState, completedProjects = [], setView }) {
  const [tab, setTab] = useState("recommended"); const [filters, setFilters] = useState({ q: "" }); const [difficulty, setDifficulty] = useState("auto");
  const [openId, setOpenId] = useState(null); const [limit, setLimit] = useState(PJ_PAGE); const [showFilters, setShowFilters] = useState(false);
  const secondary = useMemo(() => (profile.secondaryCareers || []).map(c => typeof c === "string" ? CAREER_BY_ID[c] : c).filter(Boolean), [profile.secondaryCareers]);
  const myCareers = useMemo(() => [career, ...secondary].filter(Boolean), [career, secondary]);
  const stats = useMemo(() => { const vals = Object.values(projectState); return { inprog: vals.filter(e => e.status === "in-progress").length, submitted: vals.filter(e => e.status === "submitted").length, verified: vals.filter(e => e.status === "verified").length, self: vals.filter(e => e.status === "self-reported").length, skills: projectEvidenceSkills(projectState).verified.size }; }, [projectState]);
  const update = useCallback((id) => (fn) => setProjectState(prev => { const base = prev[id] || { status: "in-progress", tasks: {}, checks: {}, mentorLog: [], history: [] }; const next = fn(base); return { ...prev, [id]: { ...next, updatedAt: pjNow() } }; }), [setProjectState]);
  const open = (id) => { setProjectState(prev => ({ ...prev, [id]: { ...(prev[id] || { status: "viewed", tasks: {}, checks: {}, mentorLog: [], history: [] }), lastViewed: pjNow() } })); setOpenId(id); if (typeof window !== "undefined") window.scrollTo && window.scrollTo(0, 0); };
  const recs = useMemo(() => recommendProjects({ career, secondaryCareers: secondary, skillState, projectState, githubData, resumeData, assessmentResults }, { limit: 12, difficulty }), [career, secondary, skillState, projectState, githubData, resumeData, assessmentResults, difficulty]);
  useEffect(() => setLimit(PJ_PAGE), [tab, filters]);
  const allCareers = useMemo(() => [...CAREERS].sort((a, b) => a.name.localeCompare(b.name)), []);
  if (openId && PROJECT_BY_ID[openId]) return <ProjectView p={PROJECT_BY_ID[openId]} entry={projectState[openId]} update={update(openId)} skillState={skillState} state={projectState} onOpen={open} onBack={() => setOpenId(null)} profile={profile} career={career} />;

  const applyF = (list, extra = {}) => filterProjects(list, { ...filters, ...extra }, projectState, career);
  let body = null; const listTab = ["all", "basic", "intermediate", "advanced", "recent", "progress", "completed", "career"].includes(tab);
  if (tab === "recommended") {
    const shown = recs.filter(r => filterProjects([r.project], filters, projectState).length);
    body = shown.length ? <div className="space-y-5"><RecommendedProject item={shown[0]} entry={projectState[shown[0].project.id]} onOpen={open} />
      {shown.length > 1 && <ProjectCatalogue items={shown.slice(1).map(r => ({ ...r.project, p: r.project, reasons: r.reasons, score: r.score, id: r.project.id }))} state={projectState} onOpen={open} skillState={skillState} />}</div>
      : <Card><EmptyState icon="sparkles" title="No recommendations match" sub="Clear the filters or pick a different difficulty." /></Card>;
  } else if (tab === "career") {
    body = <div className="space-y-8">{myCareers.map((c, ci) => { const list = applyF(projectsForRole(c.id)); return (
      <div key={c.id}><div className="flex items-center gap-2 mb-3"><h3 className="font-display text-lg font-medium">{c.name}</h3><Badge tone={ci === 0 ? "cyan" : "mute"}>{ci === 0 ? "Primary" : "Secondary"}</Badge><span className="text-xs text-mute">{list.length} projects</span></div>
        {PJ_LEVELS.map(l => { const sub = list.filter(p => p.level === l); return sub.length ? <div key={l} className="mb-5"><div className="text-xs font-mono uppercase tracking-widest text-mute mb-2">{PJ_LEVEL_LABEL[l]}</div><ProjectCatalogue items={sub.slice(0, 6)} state={projectState} onOpen={open} skillState={skillState} /></div> : null; })}</div>); })}</div>;
  } else if (listTab) {
    let base = PROJECTS;
    if (["basic", "intermediate", "advanced"].includes(tab)) base = PROJECTS.filter(p => p.level === tab);
    if (tab === "recent") base = Object.keys(projectState).filter(id => PROJECT_BY_ID[id] && projectState[id].lastViewed).sort((a, b) => projectState[b].lastViewed.localeCompare(projectState[a].lastViewed)).map(id => PROJECT_BY_ID[id]);
    if (tab === "progress") base = PROJECTS.filter(p => projectState[p.id]?.status === "in-progress");
    if (tab === "completed") base = PROJECTS.filter(p => ["self-reported", "submitted", "verified"].includes(projectState[p.id]?.status));
    let list = applyF(base);
    if (tab === "all" || ["basic", "intermediate", "advanced"].includes(tab)) { const rel = new Set(myCareers.flatMap(c => projectsForRole(c.id).map(p => p.id))); list = [...list].sort((a, b) => (rel.has(b.id) ? 1 : 0) - (rel.has(a.id) ? 1 : 0)); }
    const emptyMsg = { recent: "No recently viewed projects", progress: "No projects in progress", completed: "No completed projects" }[tab];
    body = tab === "completed" ? <div className="space-y-6"><ProjectHistory state={projectState} onOpen={open} />{legacyNote(completedProjects)}</div>
      : <ProjectCatalogue items={list.slice(0, limit)} state={projectState} onOpen={open} skillState={skillState} more={list.length > limit} onMore={() => setLimit(limit + PJ_PAGE)} total={list.length} empty={emptyMsg} />;
  }
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-10" data-testid="projects-page">
      <SectionTitle eyebrow="Proof-of-Skill Project Platform" title="Learn → Build → Prove → Verify → Improve"
        sub={`${PROJECTS.length} real-world projects across ${PROJECT_CATEGORIES.length} categories, matched to ${career?.name || "your career"}. Completion alone never verifies a skill — evidence does.`} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="project-stats">
        {[["In progress", stats.inprog, "cyan"], ["Self-reported", stats.self, "warn"], ["Evidence submitted", stats.submitted, "indigo"], ["Verified", stats.verified, "good"], ["Verified skills", stats.skills, "good"]].map(([l, v, t]) => <Card key={l} className="p-4"><div className="text-2xl font-display font-semibold">{v}</div><div className="text-xs text-mute">{l}</div></Card>)}
      </div>
      <div className="mb-4"><ProjectSearch value={filters.q || ""} onChange={q => setFilters({ ...filters, q })} /></div>
      <div className="flex gap-2 flex-wrap mb-4" role="tablist" data-testid="project-tabs">{PJ_TABS.map(([id, l]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{l}</Chip>)}</div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <Button size="sm" variant="secondary" icon="filter" onClick={() => setShowFilters(!showFilters)} data-testid="toggle-filters">{showFilters ? "Hide filters" : "Filters"}</Button>
        {tab === "recommended" && <label className="text-xs text-mute flex items-center gap-2">Difficulty <select aria-label="Recommendation difficulty" className={pjSel + " !w-auto"} value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="auto">Auto (estimated from your evidence)</option>{PJ_LEVELS.map(l => <option key={l} value={l}>{PJ_LEVEL_LABEL[l]}</option>)}</select></label>}
      </div>
      {showFilters && <div className="mb-5"><ProjectFilters filters={filters} setFilters={setFilters} careers={allCareers} hideLevel={["basic", "intermediate", "advanced"].includes(tab)} /></div>}
      {body}
    </div>
  );
}
function legacyNote(done) {
  if (!done || !done.length) return null;
  return <Card className="p-4 text-sm text-mute"><Badge tone="warn" className="mr-2">Legacy</Badge>{done.length} project(s) were marked complete in an earlier version of SkillPilot. They were self-reported only and no longer count as verified evidence — complete a project from the catalogue and submit its repository to earn verification.</Card>;
}
