function Report({ profile, career, skillState, readiness, nba, subScores }) {
  const ranked = [...career.skills].sort((a, b) => (skillState[b.id]?.score ?? 0) - (skillState[a.id]?.score ?? 0));
  const strongest = ranked.slice(0, 3);
  const gaps = [...ranked].reverse().slice(0, 3);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <SectionTitle eyebrow="Career Intelligence Report" title="Your evidence-based summary" />
        <Button variant="secondary" icon="upload" onClick={handlePrint}>Save / Print</Button>
      </div>

      <Card className="p-8 md:p-10" glow>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-8 border-b border-line">
          <div>
            <div className="text-xs text-mute mb-1">Prepared for</div>
            <div className="font-display text-xl font-semibold">{profile.name || "SkillPilot user"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-mute mb-1">Your career target</div>
            <div className="font-display text-xl font-semibold text-gradient">{career.name}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <ScoreRing score={readiness} size={150} stroke={12} label="Career Readiness" />
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 w-full">
            <ScoreBar label="Skill Confidence" score={subScores.skillConfidenceAvg} size="sm" />
            <ScoreBar label="GitHub Portfolio" score={subScores.githubScore} size="sm" />
            <ScoreBar label="Resume Match" score={subScores.resumeMatch} size="sm" />
            <ScoreBar label="Project Evidence" score={subScores.projectEvidencePct} size="sm" />
            <ScoreBar label="Assessment" score={subScores.assessmentAvg} size="sm" />
            <ScoreBar label="Interview" score={subScores.interviewAvg} size="sm" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-good mb-3">Strongest skills</h4>
            <div className="space-y-2">
              {strongest.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-mono text-good">{skillState[s.id]?.score ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-bad mb-3">Critical gaps</h4>
            <div className="space-y-2">
              {gaps.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-mono text-bad">{skillState[s.id]?.score ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {nba && (
          <div className="glass rounded-xl p-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan mb-3">Best next project & action</h4>
            <div className="font-display font-medium mb-1">{nba.project.name}</div>
            <p className="text-sm text-mute mb-3">{nba.project.description}</p>
            <p className="text-sm">Next best action: <span className="text-ink/90">Complete this project to close your {nba.skill.name} gap.</span></p>
          </div>
        )}

        <div className="text-center text-xs text-mute mt-10 pt-6 border-t border-line">
          SkillPilot AI · This is a SkillPilot-generated indicator based on submitted evidence, not an official employment probability.
        </div>
      </Card>
    </div>
  );
}
