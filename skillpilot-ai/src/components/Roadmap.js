function buildRoadmap(career, skillState) {
  const memo = {};
  const withLevel = career.skills.map(s => ({ skill: s, level: skillLevel(s, career, memo), conf: skillState[s.id]?.score ?? 0 }));
  withLevel.sort((a, b) => a.level - b.level || a.conf - b.conf);
  return withLevel;
}

function statusFor(conf, target = 75) {
  if (conf >= target) return { label: "Complete", tone: "good", icon: "check" };
  if (conf >= 40) return { label: "In progress", tone: "warn", icon: "clock" };
  return { label: "Not started", tone: "bad", icon: "x" };
}

function Roadmap({ career, skillState, setView, profile }) {
  const levelId = (profile && profile.careerLevel) || defaultCareerLevel(profile && profile.experience);
  const level = LEVEL_BY_ID[levelId];
  const target = level.target;
  const phases = buildRoadmap(career, skillState);
  const overallDone = phases.filter(p => p.conf >= target).length;
  const capstone = projectsForCareer(career).find(p => p.careerId === career.id);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Personalized Roadmap" title={`${career.name} roadmap`}
        sub="Built from your actual gaps, in dependency order — not the same path everyone gets." />

      <Card className="p-4 mb-4 flex items-center gap-3 flex-wrap text-sm" data-testid="roadmap-level">
        <Badge tone="indigo">Target level: {level.label}</Badge>
        <span className="text-mute">A skill counts as complete at <span className="text-ink font-mono">{target}/100</span> confidence. Change your level on the Target Career page.</span>
      </Card>

      <Card className="p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-mute">Overall roadmap progress</div>
          <div className="font-display text-xl font-medium">{overallDone} / {phases.length} skills at your target confidence</div>
        </div>
        <div className="w-48"><ScoreBar score={(overallDone / phases.length) * 100} showValue={false} /></div>
      </Card>

      <div className="relative pl-8">
        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo/50 via-cyan/40 to-transparent" />
        <div className="space-y-6">
          {phases.map((p, i) => {
            const st = statusFor(p.conf, target);
            const project = projectForSkill(career, p.skill.id);
            return (
              <div key={p.skill.id} className="relative">
                <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 ${st.tone === "good" ? "bg-good/20 border-good text-good" : st.tone === "warn" ? "bg-warn/20 border-warn text-warn" : "bg-navy border-line text-mute"}`}>
                  <Icon name={st.icon} size={13} />
                </div>
                <Card className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div>
                      <span className="text-xs font-mono text-mute">Phase {i + 1}</span>
                      <h3 className="font-display font-medium text-lg">{p.skill.name}</h3>
                    </div>
                    <Badge tone={st.tone}>{st.label} · {p.conf}/100</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-mute mb-1.5">Recommended resources</div>
                      <ul className="text-sm space-y-1">
                        {skillResources(p.skill.id, p.skill.name).map(r => (
                          <li key={r} className="flex items-center gap-2 text-ink/80"><Icon name="link" size={12} className="text-mute" />{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs text-mute mb-1.5">Proof project & assessment</div>
                      <div className="flex flex-col gap-2 items-start">
                        {project && <Button size="sm" variant="secondary" onClick={() => setView("projects")}>{project.name}</Button>}
                        <Button size="sm" variant="ghost" className="!px-0" onClick={() => setView("assessment")}>Take {p.skill.name} assessment →</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
          {capstone && (
            <div className="relative">
              <div className="absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-indigo/20 border-indigo text-indigo"><Icon name="award" size={13} /></div>
              <Card className="p-5 !border-indigo/30">
                <span className="text-xs font-mono text-indigo">Final phase · Capstone</span>
                <h3 className="font-display font-medium text-lg mb-1">{capstone.name}</h3>
                <p className="text-sm text-mute mb-3">{capstone.description}</p>
                <Button size="sm" variant="secondary" onClick={() => setView("projects")}>Open project</Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
