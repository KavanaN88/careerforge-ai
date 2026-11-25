function SubScoreCard({ icon, label, score, onClick, note, hasData = true, emptyLabel }) {
  return (
    <Card className="p-5 cursor-pointer hover:border-indigo/40 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-indigo/10 text-indigo flex items-center justify-center"><Icon name={icon} size={17} /></div>
        {hasData ? (
          <span className={`font-mono text-lg font-semibold ${score >= 75 ? "text-good" : score >= 45 ? "text-warn" : "text-bad"}`}>{Math.round(score)}</span>
        ) : (
          <Badge tone="mute">Not yet</Badge>
        )}
      </div>
      <div className="text-sm text-ink/90 mb-1">{label}</div>
      {hasData ? <ScoreBar score={score} showValue={false} size="sm" /> : <div className="w-full h-1.5 rounded-full bg-white/5 border border-dashed border-line" />}
      <div className="text-xs text-mute mt-2">{hasData ? note : emptyLabel}</div>
    </Card>
  );
}

function TwinCompletion({ profile, githubData, resumeData, hasAssessment, hasProject, setView }) {
  const items = [
    { label: "Basic profile", done: !!profile.name, action: null },
    { label: "Target career", done: !!profile.careerId, action: null },
    { label: "Skills", done: profile.currentSkills.length > 0, action: null },
    { label: "Connect GitHub", done: !!githubData, action: () => setView("github") },
    { label: "Upload resume", done: !!resumeData, action: () => setView("resume") },
    { label: "Take assessment", done: hasAssessment, action: () => setView("assessment") },
    { label: "Add project", done: hasProject, action: () => setView("projects") },
  ];
  const doneCount = items.filter(i => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const nextTodo = items.find(i => !i.done);

  if (pct === 100) return null;

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-mute mb-1">Career Twin Completion</div>
          <div className="font-display text-2xl font-semibold">{pct}%</div>
        </div>
        {nextTodo && (
          <Button size="sm" onClick={nextTodo.action}>Complete Career Twin <Icon name="arrow-right" size={14} /></Button>
        )}
      </div>
      <ScoreBar score={pct} showValue={false} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {items.map(i => (
          <button key={i.label} onClick={i.action || undefined} disabled={!i.action || i.done}
            className={`flex items-center gap-1.5 text-xs ${i.done ? "text-good" : "text-mute hover:text-ink"} ${i.action && !i.done ? "cursor-pointer" : "cursor-default"}`}>
            <Icon name={i.done ? "check" : "clock"} size={13} />
            {i.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ReadinessWhyModal({ open, onClose, subScores, readiness }) {
  const rows = readinessBreakdown(subScores);
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-medium">Why {readiness}/100?</h3>
          <button onClick={onClose} className="text-mute hover:text-ink p-1"><Icon name="x" size={18} /></button>
        </div>
        <div className="space-y-2.5 mb-4">
          {rows.map(r => (
            <div key={r.key} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0">
              <div>
                <span className="text-ink/90">{r.label}</span>
                <span className="text-mute text-xs ml-2">({r.weightPct}% weight · raw {r.rawScore}/100)</span>
              </div>
              <span className="font-mono text-cyan">+{r.points}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <span className="font-medium">Total</span>
          <span className="font-mono text-lg font-semibold text-gradient">{readiness}/100</span>
        </div>
        <p className="text-xs text-mute mt-4">Career Readiness is a transparent, weighted rollup — never a black-box AI guess. Weights are configurable per career in production.</p>
      </div>
    </Modal>
  );
}

function Dashboard({ profile, career, skillState, subScores, readiness, nba, setView, githubData, resumeData, hasAssessment, hasInterview, hasProject }) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Welcome back, {profile.name?.split(" ")[0] || "there"}. 👋</h1>
          <p className="text-mute mt-1">Target career — <span className="text-cyan">{career?.name}</span></p>
        </div>
        <Button variant="secondary" size="sm" icon="target" onClick={() => setView("twin")}>View Digital Twin</Button>
      </div>


      <TwinCompletion profile={profile} githubData={githubData} resumeData={resumeData} hasAssessment={hasAssessment} hasProject={hasProject} setView={setView} />

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 mb-8">
        <Card className="p-8 flex flex-col items-center justify-center text-center" glow>
          <span className="text-xs font-mono uppercase tracking-widest text-mute mb-4">Career Readiness</span>
          <ScoreRing score={readiness} size={160} stroke={12} />
          <button onClick={() => setWhyOpen(true)} className="text-xs text-cyan hover:underline mt-4 flex items-center gap-1">
            Why this score? <Icon name="chevron-right" size={12} />
          </button>
          <p className="text-xs text-mute mt-2 max-w-[200px]">A SkillPilot-generated indicator — not an official employment probability.</p>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <SubScoreCard icon="target" label="Skill Confidence" score={subScores.skillConfidenceAvg} onClick={() => setView("twin")} note="Across your target career's skill graph" />
          <SubScoreCard icon="github" label="GitHub Portfolio" score={subScores.githubScore} hasData={!!githubData} emptyLabel="Not connected" onClick={() => setView("github")} note={githubData ? `${githubData.repoCount} public repos analyzed` : ""} />
          <SubScoreCard icon="file-text" label="Resume Match" score={subScores.resumeMatch} hasData={!!resumeData} emptyLabel="Resume not submitted" onClick={() => setView("resume")} note="Resume analyzed" />
          <SubScoreCard icon="layers" label="Project Evidence" score={subScores.projectEvidencePct} onClick={() => setView("projects")} note="Skills backed by a shipped project" />
          <SubScoreCard icon="brain-circuit" label="Assessment Score" score={subScores.assessmentAvg} hasData={hasAssessment} emptyLabel="Not attempted" onClick={() => setView("assessment")} note="Average across skills tested" />
          <SubScoreCard icon="message-circle" label="Interview Readiness" score={subScores.interviewAvg} hasData={hasInterview} emptyLabel="Not attempted" onClick={() => setView("interview")} note="Technical + communication + problem-solving" />
        </div>
      </div>

      {nba && (
        <Card className="p-6 md:p-7 mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Icon name="zap" size={16} className="text-cyan" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan">Your Next Best Action</span>
          </div>
          <h3 className="font-display text-xl font-medium mb-2">Improve {nba.skill.name} confidence</h3>
          <p className="text-mute text-sm mb-1 max-w-2xl">
            <span className="text-mute">Why?</span> {nba.skill.name} is important for your target role ({career.name}), but your current evidence is {nba.confidence < 40 ? "weak" : "moderate"}.
          </p>
          <p className="text-mute text-xs mb-4">Expected impact: confidence <span className="text-good">+15–20 points</span> after verified completion.</p>
          <div className="glass rounded-xl p-4 mb-4 max-w-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Recommended: {nba.project.name}</span>
              <Badge tone="cyan">Proof-of-skill</Badge>
            </div>
            <p className="text-xs text-mute">{nba.project.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={() => setView("projects")} iconRight="arrow-right">Start Challenge</Button>
            <Button size="sm" variant="secondary" onClick={() => setView("twin")}>See why this matters</Button>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between cursor-pointer hover:border-indigo/40" onClick={() => setView("roadmap")}>
          <div>
            <div className="font-display font-medium">Roadmap</div>
            <div className="text-xs text-mute mt-1">See your personalized path</div>
          </div>
          <Icon name="chevron-right" className="text-mute" />
        </Card>
        <Card className="p-5 flex items-center justify-between cursor-pointer hover:border-indigo/40" onClick={() => setView("job")}>
          <div>
            <div className="font-display font-medium">Match a job</div>
            <div className="text-xs text-mute mt-1">Paste a JD, see your fit</div>
          </div>
          <Icon name="chevron-right" className="text-mute" />
        </Card>
        <Card className="p-5 flex items-center justify-between cursor-pointer hover:border-indigo/40" onClick={() => setView("report")}>
          <div>
            <div className="font-display font-medium">Career report</div>
            <div className="text-xs text-mute mt-1">Your shareable summary</div>
          </div>
          <Icon name="chevron-right" className="text-mute" />
        </Card>
      </div>

      <ReadinessWhyModal open={whyOpen} onClose={() => setWhyOpen(false)} subScores={subScores} readiness={readiness} />
    </div>
  );
}
