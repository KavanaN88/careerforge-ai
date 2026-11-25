function GithubAnalyzer({ career, username, setUsername, githubData, onAnalyze }) {
  const [loading, setLoading] = useState(false);
  const [localUsername, setLocalUsername] = useState(username || "");

  const run = () => {
    if (!localUsername.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setUsername(localUsername.trim());
      onAnalyze(localUsername.trim());
      setLoading(false);
    }, 900);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="GitHub Analyzer" title="What does your GitHub actually prove?"
        sub="We read publicly available repository data — activity, documentation, tech diversity — and match it against your target career's skills." />

      <Card className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="github" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
            <input className={inputCls + " pl-10"} value={localUsername} onChange={e => setLocalUsername(e.target.value)}
              placeholder="Enter your GitHub username" onKeyDown={e => e.key === "Enter" && run()} />
          </div>
          <Button onClick={run} disabled={loading || !localUsername.trim()} icon={loading ? undefined : "sparkles"}>
            {loading ? <><Spinner size={15} /> Analyzing…</> : "Analyze GitHub"}
          </Button>
        </div>
        <p className="text-xs text-mute mt-3">Demo mode: analysis is simulated deterministically from the username so results are consistent, not fetched live from GitHub.</p>
      </Card>

      {!githubData && !loading && (
        <EmptyState icon="github" title="No GitHub connected yet" sub="Enter a username above to generate your GitHub Portfolio Score." />
      )}

      {githubData && (
        <div className="fade-up">
          <div className="grid md:grid-cols-[auto_1fr] gap-6 mb-6">
            <Card className="p-7 flex flex-col items-center justify-center text-center" glow>
              <span className="text-xs font-mono uppercase tracking-widest text-mute mb-3">Portfolio Score</span>
              <ScoreRing score={githubData.portfolioScore} size={130} stroke={11} />
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-medium mb-4">Portfolio Health</h3>
              <div className="space-y-3.5">
                <ScoreBar label="Project Quality" score={githubData.projectQuality} size="sm" />
                <ScoreBar label="Documentation" score={githubData.docQuality} size="sm" />
                <ScoreBar label="Technology Diversity" score={githubData.techDiversity} size="sm" />
                <ScoreBar label="Activity" score={githubData.activityScore} size="sm" />
                <ScoreBar label="Deployment Evidence" score={githubData.deploymentEvidenceScore} size="sm" />
              </div>
            </Card>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4"><div className="text-2xl font-display font-semibold">{githubData.repoCount}</div><div className="text-xs text-mute mt-1">Public repositories</div></Card>
            <Card className="p-4 sm:col-span-2">
              <div className="text-xs text-mute mb-2">Languages detected</div>
              <div className="flex flex-wrap gap-1.5">{githubData.languages.map(l => <Badge key={l} tone="mute">{l}</Badge>)}</div>
            </Card>
          </div>

          {githubData.deploymentEvidenceScore < 45 && (
            <Card className="p-5 mb-6 !bg-warn/5 border-warn/25">
              <div className="flex items-center gap-2 mb-2 text-warn text-sm font-medium"><Icon name="alert-triangle" size={15} /> Missing portfolio evidence</div>
              <p className="text-sm text-mute mb-3">
                You have {githubData.languages.length > 1 ? "several strong repositories" : "some repositories"} but very little evidence of a real deployment — no live URL, container, or hosted demo detected.
              </p>
              <p className="text-sm"><span className="text-mute">Recommendation:</span> build and deploy one production-style application using Docker + a cloud provider, then link it from the README.</p>
            </Card>
          )}

          <Card className="p-6 mb-6">
            <h3 className="font-display font-medium mb-1">Skills this portfolio provides evidence for</h3>
            <p className="text-xs text-mute mb-4">Matched against the {career.name} skill graph.</p>
            <div className="flex flex-wrap gap-2">
              {career.skills.map(s => {
                const has = githubData.evidencedSkills.includes(s.id);
                return <Badge key={s.id} tone={has ? "good" : "mute"}>{has ? "✓ " : ""}{s.name}</Badge>;
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display font-medium mb-4">Project-level evidence</h3>
            <div className="space-y-3">
              {githubData.projects.map(p => (
                <div key={p.name} className="glass rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-mute flex items-center gap-1"><Icon name="star" size={11} />{p.stars}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.evidence.map(e => <Badge key={e} tone="cyan">{e}</Badge>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-mute mt-4">Note: repository existence alone doesn't prove expertise — SkillPilot weighs this alongside assessments and interviews, not in isolation.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
