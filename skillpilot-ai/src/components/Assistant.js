function generateAssistantReply(question, ctx) {
  const q = question.toLowerCase();
  const { career, skillState, nba, readiness, githubData, resumeData, subScores } = ctx;

  const weakest = [...career.skills].sort((a, b) => (skillState[a.id]?.score ?? 0) - (skillState[b.id]?.score ?? 0))[0];
  const strongest = [...career.skills].sort((a, b) => (skillState[b.id]?.score ?? 0) - (skillState[a.id]?.score ?? 0))[0];

  const skillMentioned = career.skills.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.id));

  if (skillMentioned && /low|why|weak|score/.test(q)) {
    const ev = skillState[skillMentioned.id];
    const missingBits = [];
    if (!ev?.breakdown?.length || ev.score < 50) missingBits.push("hasn't been backed by enough evidence yet");
    return `${skillMentioned.name} is currently at ${ev?.score ?? 0}/100. That score comes from resume mentions, GitHub proof, deployments, assessments and interviews — right now it ${missingBits[0] || "has some evidence but could use more"}. The fastest lever: submit a proof-of-skill project that uses ${skillMentioned.name} directly.`;
  }

  if (/what should i learn|learn next|next skill/.test(q)) {
    return `Based on your twin, ${weakest.name} has the most leverage right now — it's foundational to ${career.name} but your evidence for it is thin (${skillState[weakest.id]?.score ?? 0}/100). I'd start there.`;
  }

  if (/which project|what project|build/.test(q)) {
    if (nba) return `I'd build "${nba.project.name}" — ${nba.project.description} It directly proves ${nba.skill.name}, your highest-leverage gap.`;
    return `Head to the Projects page — I'll match a proof-of-skill project to your current biggest gap once your twin has a bit more data.`;
  }

  if (/not ready|why am i not ready|readiness/.test(q)) {
    const parts = Object.entries(subScores).sort((a, b) => a[1] - b[1]).slice(0, 2);
    const labelMap = { skillConfidenceAvg: "skill confidence", githubScore: "GitHub portfolio", resumeMatch: "resume match", projectEvidencePct: "project evidence", assessmentAvg: "assessment score", interviewAvg: "interview readiness" };
    return `Your Career Readiness is ${readiness}/100. The two areas pulling it down most are ${labelMap[parts[0][0]]} (${Math.round(parts[0][1])}) and ${labelMap[parts[1][0]]} (${Math.round(parts[1][1])}). Improving either will move the needle fastest.`;
  }

  if (/github|improve my github|portfolio/.test(q)) {
    if (!githubData) return `You haven't connected GitHub yet — head to the GitHub Analyzer and enter your username. That alone will likely move your readiness score.`;
    return `Your GitHub Portfolio Score is ${Math.round(githubData.portfolioScore)}/100. Documentation quality is at ${githubData.docQuality} — adding clear READMEs with setup steps and screenshots to your top ${career.name}-relevant repos is the quickest win.`;
  }

  if (/interview|prepare for.*interview|prep/.test(q)) {
    return `For a ${career.name} interview, expect deep questions on ${strongest.name} and ${weakest.name}. Practice explaining trade-offs out loud, not just what you built — that's usually where candidates lose points.`;
  }

  if (/resume/.test(q)) {
    if (!resumeData) return `Paste your resume in the Resume Intelligence page and I'll tell you exactly which ${career.name} skills are missing from it.`;
    return `Your resume match is ${resumeData.matchPct}%. ${resumeData.missing.length ? `Add concrete evidence for ${resumeData.missing.slice(0,2).map(s=>s.name).join(", ")}.` : "It already covers your core skill list well."}`;
  }

  return `Here's where things stand: Career Readiness is ${readiness}/100, your strongest skill is ${strongest.name}, and your biggest gap is ${weakest.name}. Ask me things like "why is my ${weakest.name} score low" or "what should I build next" for specifics.`;
}

function Assistant(ctx) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I'm connected to your Career Digital Twin. Ask me why a score is what it is, what to learn next, or what to build." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input.trim() };
    const reply = { role: "assistant", text: generateAssistantReply(input.trim(), ctx) };
    setMessages(m => [...m, userMsg, reply]);
    setInput("");
  };

  const suggestions = ["What should I learn next?", "Why is my weakest skill low?", "Which project should I build?", "Why am I not ready for this job?"];

  return (
    <React.Fragment>
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo to-cyan shadow-glow flex items-center justify-center text-white hover:scale-105 transition-transform">
        <Icon name={open ? "x" : "message-circle"} size={22} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-2.5rem))] h-[min(520px,calc(100vh-9rem))] glass-strong rounded-2xl shadow-glow flex flex-col fade-up overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center"><Icon name="sparkles" size={15} className="text-white" /></div>
            <div>
              <div className="font-display font-medium text-sm">Career Intelligence Assistant</div>
              <div className="text-[11px] text-mute">Answers from your actual twin data</div>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm max-w-[88%] px-3.5 py-2.5 rounded-2xl leading-relaxed ${m.role === "user" ? "ml-auto bg-indigo/20 text-ink rounded-br-sm" : "bg-white/5 text-ink/90 rounded-bl-sm"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 2).map(s => (
              <button key={s} onClick={() => { setInput(s); }} className="text-[11px] chip px-2.5 py-1 rounded-full text-mute hover:text-ink">{s}</button>
            ))}
          </div>
          <div className="p-3 border-t border-line flex items-center gap-2">
            <input className="flex-1 bg-panel2 border border-line rounded-xl px-3.5 py-2 text-sm focus:border-indigo/60"
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about your career twin..." />
            <button onClick={send} className="w-9 h-9 rounded-xl bg-indigo/20 text-indigo flex items-center justify-center hover:bg-indigo/30 shrink-0">
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
