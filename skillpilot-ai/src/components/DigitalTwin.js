function skillLevel(skill, career, memo = {}) {
  if (memo[skill.id] !== undefined) return memo[skill.id];
  if (!skill.deps.length) { memo[skill.id] = 0; return 0; }
  const depLevels = skill.deps.map(depId => {
    const dep = career.skills.find(s => s.id === depId);
    return dep ? skillLevel(dep, career, memo) : 0;
  });
  const lvl = Math.max(...depLevels) + 1;
  memo[skill.id] = lvl;
  return lvl;
}

function SkillNode({ skill, score, onClick }) {
  const tone = score >= 75 ? "good" : score >= 45 ? "warn" : "bad";
  const toneClasses = { good: "border-good/40 text-good", warn: "border-warn/40 text-warn", bad: "border-bad/40 text-bad" };
  return (
    <button onClick={onClick}
      className={`group w-full glass rounded-xl p-3.5 text-left border hover:shadow-glow transition-all ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink">{skill.name}</span>
        <span className="font-mono text-xs font-semibold">{score}</span>
      </div>
      <ScoreBar score={score} showValue={false} size="sm" />
      {skill.deps.length > 0 && (
        <div className="text-[10px] text-mute mt-2 truncate">builds on {skill.deps.length} skill{skill.deps.length > 1 ? "s" : ""}</div>
      )}
    </button>
  );
}

function SkillDetailModal({ skill, career, evidence, score, breakdown, onClose, onGoAssess, onGoProjects }) {
  if (!skill) return null;
  const strength = strengthLabel(score);
  const kp = computeKnowledgeProof(evidence);
  const missing = [];
  if (!evidence.resumeMention) missing.push("Add it to your resume");
  if (!evidence.githubProject) missing.push("Show it in a public GitHub project");
  if (!evidence.deploymentEvidence) missing.push("Ship a real deployment or working demo");
  if (evidence.assessmentScore === null) missing.push("Take the AI technical assessment");
  if (evidence.interviewScore === null) missing.push("Complete an AI interview round");
  const deps = skill.deps.map(id => career.skills.find(s => s.id === id)).filter(Boolean);
  const dependents = career.skills.filter(s => s.deps.includes(skill.id));

  return (
    <Modal open={!!skill} onClose={onClose} wide>
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={strength.color}>{strength.label}</Badge>
              {skill.deps.length === 0 && <Badge tone="mute">Foundational</Badge>}
            </div>
            <h2 className="font-display text-2xl font-semibold">{skill.name}</h2>
          </div>
          <button onClick={onClose} className="text-mute hover:text-ink p-1"><Icon name="x" size={20} /></button>
        </div>

        <div className="grid md:grid-cols-[auto_1fr] gap-8 mb-6">
          <ScoreRing score={score} size={128} stroke={11} label="Confidence" />
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-mute mb-3">Why this score</h4>
            <div className="space-y-1.5">
              {breakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0">
                  <span className={b.positive ? "text-ink/90" : "text-mute"}>{b.label}</span>
                  <span className={`font-mono text-xs ${b.positive ? "text-good" : "text-mute"}`}>{b.delta > 0 ? `+${b.delta}` : b.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-mute mb-3">
            <Icon name="sparkles" size={12} className="text-cyan" />
            Knowing something and proving it are different — SkillPilot tracks both.
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Knowledge</span>
                <span className="font-mono text-xs text-mute">{kp.knowledge}/100</span>
              </div>
              <ScoreBar score={kp.knowledge} showValue={false} />
              <p className="text-[11px] text-mute mt-1.5">From assessments &amp; interviews — can you explain it?</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Proof</span>
                <span className="font-mono text-xs text-mute">{kp.proof}/100</span>
              </div>
              <ScoreBar score={kp.proof} showValue={false} />
              <p className="text-[11px] text-mute mt-1.5">From resume, GitHub &amp; deployments — can you show it?</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-mute mb-3">Evidence on file</h4>
            <div className="glass rounded-xl p-4">
              <EvidenceRow ok={evidence.resumeMention}>Mentioned in resume</EvidenceRow>
              <EvidenceRow ok={evidence.githubProject}>Used in a GitHub project</EvidenceRow>
              <EvidenceRow ok={evidence.deploymentEvidence}>Real deployment detected</EvidenceRow>
              <EvidenceRow ok={evidence.assessmentScore !== null}>Technical assessment {evidence.assessmentScore !== null ? `— ${evidence.assessmentScore}/10` : "— not taken"}</EvidenceRow>
              <EvidenceRow ok={evidence.interviewScore !== null}>AI interview {evidence.interviewScore !== null ? `— ${evidence.interviewScore}/10` : "— not completed"}</EvidenceRow>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-mute mb-3">Skill dependencies</h4>
            <div className="glass rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-mute mb-1.5">Builds on</div>
                <div className="flex flex-wrap gap-1.5">{deps.length ? deps.map(d => <Badge key={d.id} tone="mute">{d.name}</Badge>) : <span className="text-xs text-mute">None — foundational skill</span>}</div>
              </div>
              <div>
                <div className="text-xs text-mute mb-1.5">Unlocks</div>
                <div className="flex flex-wrap gap-1.5">{dependents.length ? dependents.map(d => <Badge key={d.id} tone="indigo">{d.name}</Badge>) : <span className="text-xs text-mute">Nothing downstream</span>}</div>
              </div>
            </div>
          </div>
        </div>

        {missing.length > 0 && (
          <Card className="p-4 mb-6 !bg-amber-500/5 border-warn/25">
            <div className="flex items-center gap-2 mb-2 text-warn text-sm font-medium"><Icon name="alert-triangle" size={15} /> Recommended improvement</div>
            <p className="text-sm text-mute">{missing[0]}{missing.length > 1 ? `, then: ${missing.slice(1).join("; ")}.` : "."}</p>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={onGoAssess}>Take assessment for this skill</Button>
          <Button variant="secondary" onClick={onGoProjects}>Find a proof-of-skill project</Button>
        </div>
      </div>
    </Modal>
  );
}

function DigitalTwin({ career, skillState, evidenceMap, setView }) {
  const [openSkillId, setOpenSkillId] = useState(null);
  const memo = {};
  const levels = {};
  career.skills.forEach(s => {
    const lvl = skillLevel(s, career, memo);
    levels[lvl] = levels[lvl] || [];
    levels[lvl].push(s);
  });
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
  const openSkill = career.skills.find(s => s.id === openSkillId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Career Digital Twin" title={`${career.name} skill graph`}
        sub="Click any skill to see exactly why it's scored the way it is, and what would move it." />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {levelKeys.map(lvl => (
          <div key={lvl} className="flex flex-col gap-3 min-w-[220px] flex-1">
            <div className="text-[11px] font-mono text-mute uppercase tracking-wider px-1">
              {lvl === 0 ? "Foundation" : `Depth ${lvl}`}
            </div>
            {levels[lvl].map(skill => (
              <SkillNode key={skill.id} skill={skill} score={skillState[skill.id]?.score ?? 0} onClick={() => setOpenSkillId(skill.id)} />
            ))}
          </div>
        ))}
      </div>

      <Card className="p-6 mt-8">
        <h3 className="font-display font-medium mb-4">Twin summary</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-mute text-xs mb-1">Strongest skill</div>
            <div className="font-medium">{[...career.skills].sort((a, b) => (skillState[b.id]?.score ?? 0) - (skillState[a.id]?.score ?? 0))[0]?.name}</div>
          </div>
          <div>
            <div className="text-mute text-xs mb-1">Weakest skill</div>
            <div className="font-medium">{[...career.skills].sort((a, b) => (skillState[a.id]?.score ?? 0) - (skillState[b.id]?.score ?? 0))[0]?.name}</div>
          </div>
          <div>
            <div className="text-mute text-xs mb-1">Skills with strong evidence (≥75)</div>
            <div className="font-medium">{career.skills.filter(s => (skillState[s.id]?.score ?? 0) >= 75).length} / {career.skills.length}</div>
          </div>
        </div>
      </Card>

      {openSkill && (
        <SkillDetailModal
          skill={openSkill}
          career={career}
          evidence={evidenceMap[openSkill.id] || {}}
          score={skillState[openSkill.id]?.score ?? 0}
          breakdown={skillState[openSkill.id]?.breakdown ?? []}
          onClose={() => setOpenSkillId(null)}
          onGoAssess={() => { setOpenSkillId(null); setView("assessment"); }}
          onGoProjects={() => { setOpenSkillId(null); setView("projects"); }}
        />
      )}
    </div>
  );
}
