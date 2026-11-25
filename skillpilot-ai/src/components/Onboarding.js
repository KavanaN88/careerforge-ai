const COMMON_SKILLS = ["Python", "JavaScript", "SQL", "Git", "Linux", "AWS", "Docker", "React",
  "Java", "C++", "Statistics", "Networking", "Excel", "Node.js", "Kubernetes", "Machine Learning"];

const EXPERIENCE_LEVELS = [
  { id: "student", label: "Student", desc: "Currently studying, little to no work experience" },
  { id: "fresher", label: "Fresher", desc: "Recently graduated, 0–1 years experience" },
  { id: "junior", label: "1–3 years", desc: "Some professional experience" },
  { id: "mid", label: "3+ years", desc: "Established in the field, leveling up" },
];

function StepShell({ step, total, title, sub, children, onBack, onNext, nextLabel = "Continue", nextDisabled }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-cyan">Step {step} of {total}</span>
        <span className="text-xs text-mute">{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-10">
        <div className="h-full bg-gradient-to-r from-indigo to-cyan rounded-full transition-all duration-500" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2 fade-up">{title}</h2>
      {sub && <p className="text-mute mb-8 fade-up">{sub}</p>}
      <div className="fade-up">{children}</div>
      <div className="flex items-center justify-between mt-10">
        <Button variant="ghost" onClick={onBack} icon="chevron-left" disabled={step === 1}>Back</Button>
        <Button variant="primary" onClick={onNext} iconRight="chevron-right" disabled={nextDisabled}>{nextLabel}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-5">
      <span className="block text-sm text-mute mb-2">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full bg-panel2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60 transition-colors";

function Onboarding({ profile, setProfile, onComplete }) {
  const [step, setStep] = useState(1);
  const total = 5;
  const update = (patch) => setProfile(p => ({ ...p, ...patch }));

  const next = () => step < total ? setStep(step + 1) : onComplete();
  const back = () => step > 1 && setStep(step - 1);

  if (step === 1) {
    return (
      <StepShell step={1} total={total} title="Tell us about you" sub="This helps SkillPilot calibrate your baseline."
        onBack={back} onNext={next} nextDisabled={!profile.name}>
        <Field label="Full name">
          <input className={inputCls} value={profile.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Aditi Sharma" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Education">
            <input className={inputCls} value={profile.education} onChange={e => update({ education: e.target.value })} placeholder="B.Tech" />
          </Field>
          <Field label="Branch / Major">
            <input className={inputCls} value={profile.branch} onChange={e => update({ branch: e.target.value })} placeholder="Computer Science" />
          </Field>
        </div>
        <Field label="Graduation year">
          <input className={inputCls} type="number" value={profile.gradYear} onChange={e => update({ gradYear: e.target.value })} placeholder="2026" />
        </Field>
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell step={2} total={total} title="What's your experience level?" onBack={back} onNext={next} nextDisabled={!profile.experience}>
        <div className="grid sm:grid-cols-2 gap-3">
          {EXPERIENCE_LEVELS.map(l => (
            <button key={l.id} onClick={() => update({ experience: l.id })}
              className={`text-left p-4 rounded-xl border glass transition-colors ${profile.experience === l.id ? "border-indigo shadow-glow" : "border-line hover:border-indigo/40"}`}>
              <div className="font-medium">{l.label}</div>
              <div className="text-xs text-mute mt-1">{l.desc}</div>
            </button>
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell step={3} total={total} title="What skills do you already have?" sub="Select what applies — SkillPilot will verify these against real evidence later."
        onBack={back} onNext={next}>
        <SkillPicker value={profile.currentSkills}
          onChange={(names, selections) => update({ currentSkills: names, skillSelections: selections })} />
      </StepShell>
    );
  }

  if (step === 4) {
    return (
      <StepShell step={4} total={total} title="Choose your target career" sub="Everything downstream — your twin, roadmap and assessments — is built around this."
        onBack={back} onNext={next} nextDisabled={!profile.careerId}>
        <CareerGrid selectedId={profile.careerId} onSelect={(id) => update({ careerId: id })} />
      </StepShell>
    );
  }

  return (
    <StepShell step={5} total={total} title="Connect your evidence" sub="Optional now — you can always add this later from your dashboard."
      onBack={back} onNext={next} nextLabel="Generate My Career Twin" nextDisabled={false}>
      <Field label="GitHub username (optional)">
        <div className="relative">
          <Icon name="github" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          <input className={inputCls + " pl-10"} value={profile.githubUsername}
            onChange={e => update({ githubUsername: e.target.value })} placeholder="octocat" />
        </div>
      </Field>
      <Field label="Resume text (optional — paste for this demo instead of uploading a file)">
        <textarea className={inputCls + " min-h-[110px] resize-y"} value={profile.resumeText}
          onChange={e => update({ resumeText: e.target.value })}
          placeholder="Paste your resume text here, e.g. 'Built REST APIs in Python and deployed on AWS using Docker...' " />
      </Field>
      <Field label="Preferred technologies">
        <div className="flex flex-wrap gap-2">
          {COMMON_SKILLS.map(s => (
            <Chip key={s} active={profile.preferredTech.includes(s)}
              onClick={() => setProfile(p => ({ ...p, preferredTech: p.preferredTech.includes(s) ? p.preferredTech.filter(x => x !== s) : [...p.preferredTech, s] }))}>
              {s}
            </Chip>
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
