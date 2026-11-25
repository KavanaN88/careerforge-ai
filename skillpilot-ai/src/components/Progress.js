function LineChart({ series, width = 640, height = 220, color = "#06B6D4" }) {
  const pad = 28;
  const max = 100, min = 0;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const stepX = series.length > 1 ? w / (series.length - 1) : 0;
  const points = series.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + h - ((v.value - min) / (max - min)) * h;
    return { x, y, ...v };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${pad + h} L ${points[0].x.toFixed(1)} ${pad + h} Z`;
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map(g => {
        const y = pad + h - (g / 100) * h;
        return (
          <g key={g}>
            <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
            <text x={4} y={y + 3} fontSize="9" fill="#94A3B8" fontFamily="JetBrains Mono, monospace">{g}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3.5} fill={i === points.length - 1 ? color : "#151B2E"} stroke={color} strokeWidth="2" />
          <text x={p.x} y={height - 6} fontSize="10" textAnchor="middle" fill="#94A3B8" fontFamily="Inter, sans-serif">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Progress({ history, subScoreHistory }) {
  const [metric, setMetric] = useState("readiness");
  const metrics = [
    { id: "readiness", label: "Career Readiness" },
    { id: "skillConfidenceAvg", label: "Skill Confidence" },
    { id: "githubScore", label: "GitHub Portfolio" },
    { id: "assessmentAvg", label: "Assessment" },
    { id: "interviewAvg", label: "Interview" },
  ];
  const series = metric === "readiness" ? history : subScoreHistory[metric];
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const delta = Math.round(last - first);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Progress" title="How your career profile has changed" sub="Every completed project, assessment and interview leaves a mark here." />

      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map(m => <Chip key={m.id} active={metric === m.id} onClick={() => setMetric(m.id)}>{m.label}</Chip>)}
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-mute">{metrics.find(m => m.id === metric).label}</div>
            <div className="font-display text-2xl font-semibold">{Math.round(last)}<span className="text-mute text-base font-normal">/100</span></div>
          </div>
          <Badge tone={delta >= 0 ? "good" : "bad"}>{delta >= 0 ? "+" : ""}{delta} since {series[0]?.label}</Badge>
        </div>
        <LineChart series={series} />
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-mute mb-1">Starting point</div>
          <div className="font-display text-xl font-semibold">{Math.round(first)}/100</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-mute mb-1">Current</div>
          <div className="font-display text-xl font-semibold">{Math.round(last)}/100</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-mute mb-1">Net change</div>
          <div className={`font-display text-xl font-semibold ${delta >= 0 ? "text-good" : "text-bad"}`}>{delta >= 0 ? "+" : ""}{delta}</div>
        </Card>
      </div>
    </div>
  );
}
