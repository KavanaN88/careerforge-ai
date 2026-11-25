function ResumeIntel({ career, resumeText, setResumeText, resumeData, onAnalyze }) {
  const [local, setLocal] = useState(resumeText || "");
  const [loading, setLoading] = useState(false);

  const run = () => {
    if (!local.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResumeText(local);
      onAnalyze(local);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Resume Intelligence" title="Compare your resume to your target career"
        sub="Paste your resume text below. SkillPilot extracts skills and checks each one against your target career's requirements." />

      <Card className="p-6 mb-8">
        <Field label="Resume text">
          <textarea className={inputCls + " min-h-[180px] resize-y"} value={local} onChange={e => setLocal(e.target.value)}
            placeholder="Paste your resume content here — experience, projects, skills, education..." />
        </Field>
        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={loading || !local.trim()} icon={loading ? undefined : "upload"}>
            {loading ? <><Spinner size={15} /> Analyzing…</> : "Analyze Resume"}
          </Button>
          <span className="text-xs text-mute">Demo mode: matching is done locally via keyword extraction, not sent to a server.</span>
        </div>
      </Card>

      {!resumeData && !loading && (
        <EmptyState icon="file-text" title="No resume analyzed yet" sub="Paste your resume above to see your match against the career's required skills." />
      )}

      {resumeData && (
        <div className="fade-up space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
              <h3 className="font-display text-lg font-medium">{career.name} Resume Match</h3>
              <span className="font-mono text-2xl font-semibold text-gradient">{resumeData.matchPct}%</span>
            </div>
            <ScoreBar score={resumeData.matchPct} showValue={false} />
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-good mb-3">Strong — found in resume</h4>
              <div className="space-y-1.5">
                {resumeData.matched.length ? resumeData.matched.map(s => (
                  <EvidenceRow key={s.id} ok={true}>{s.name}</EvidenceRow>
                )) : <p className="text-sm text-mute">No direct skill matches found yet.</p>}
              </div>
            </Card>
            <Card className="p-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-warn mb-3">Missing — not mentioned</h4>
              <div className="space-y-1.5">
                {resumeData.missing.length ? resumeData.missing.map(s => (
                  <EvidenceRow key={s.id} ok={false}>{s.name}</EvidenceRow>
                )) : <p className="text-sm text-mute">Every core skill is mentioned. Nice.</p>}
              </div>
            </Card>
          </div>

          {resumeData.achievementLines.length > 0 && (
            <Card className="p-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-mute mb-3">Detected achievements</h4>
              <ul className="space-y-2">
                {resumeData.achievementLines.map((l, i) => (
                  <li key={i} className="text-sm text-ink/90 flex gap-2"><Icon name="award" size={14} className="text-cyan mt-0.5 shrink-0" />{l}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6 !bg-indigo/5 border-indigo/25">
            <div className="flex items-center gap-2 mb-2 text-indigo text-sm font-medium"><Icon name="sparkles" size={15} /> Suggestions to improve your resume</div>
            <p className="text-sm text-mute">
              {resumeData.missing.length > 0
                ? `Add concrete evidence for ${resumeData.missing.slice(0, 3).map(s => s.name).join(", ")} — a project line, a metric, or a link to a repo will do more than just listing the keyword.`
                : "Your resume already covers the core skill list — focus on quantifying impact (numbers, scale, outcomes) for each bullet."}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
