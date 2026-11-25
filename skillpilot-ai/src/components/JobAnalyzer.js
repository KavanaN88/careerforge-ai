function JobAnalyzer({ career, skillState, setView }) {
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(analyzeJobDescription(jdText, career, skillState));
      setLoading(false);
    }, 800);
  };

  const StatusBadge = ({ status }) => {
    const map = { strong: ["good", "✓"], partial: ["warn", "⚠"], missing: ["bad", "✗"] };
    const [tone, mark] = map[status];
    return <Badge tone={tone}>{mark}</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Job Matcher" title="How well do you match a real job posting?"
        sub="Paste a job description. SkillPilot extracts required and preferred skills and compares them to your Career Digital Twin." />

      <Card className="p-6 mb-8">
        <Field label="Job description">
          <textarea className={inputCls + " min-h-[180px] resize-y"} value={jdText} onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..." />
        </Field>
        <Button onClick={run} disabled={loading || !jdText.trim()} icon={loading ? undefined : "search"}>
          {loading ? <><Spinner size={15} /> Matching…</> : "Analyze Match"}
        </Button>
      </Card>

      {!result && !loading && (
        <EmptyState icon="briefcase" title="No job pasted yet" sub="Paste a job description above to see your fit, skill by skill." />
      )}

      {result && (
        <div className="fade-up space-y-6">
          <Card className="p-6" glow>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-display text-lg font-medium">Job Match</h3>
                <p className="text-xs text-mute mt-1">{result.strong.length} strong · {result.partial.length} partial · {result.missing.length} missing</p>
              </div>
              <span className="font-mono text-3xl font-semibold text-gradient">{result.matchPct}%</span>
            </div>
          </Card>

          {result.missing.length > 0 && (() => {
            const blocker = [...result.missing].sort((a, b) => b.skill.weight - a.skill.weight)[0];
            return (
              <Card className="p-5 !bg-bad/5 border-bad/25 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-bad mb-1">Biggest blocker</div>
                  <div className="font-display font-medium text-lg">{blocker.skill.name}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setView("projects")} icon="layers">Find a proof challenge</Button>
              </Card>
            );
          })()}

          <Card className="p-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-mute mb-4">Skill-by-skill breakdown</h4>
            <div className="space-y-2.5">
              {[...result.strong, ...result.partial, ...result.missing].map(({ skill, status }) => (
                <div key={skill.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <span className="text-sm">{skill.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-mute">{skillState[skill.id]?.score ?? 0}/100</span>
                    <StatusBadge status={status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 !bg-cyan/5 border-cyan/25">
            <div className="flex items-center gap-2 mb-2 text-cyan text-sm font-medium"><Icon name="sparkles" size={15} /> Why this match is {result.matchPct >= 70 ? "strong" : result.matchPct >= 40 ? "moderate" : "low"}</div>
            <p className="text-sm text-mute">
              {result.missing.length > 0
                ? `You're missing solid evidence for ${result.missing.slice(0, 3).map(m => m.skill.name).join(", ")}. These carry real weight in this posting — closing them would meaningfully raise your match.`
                : "You have at least partial evidence for every skill this posting asks for. Focus on turning partial matches into strong ones."}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
