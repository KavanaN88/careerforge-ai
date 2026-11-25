function Avatar({ name, size = 36 }) {
  const initials = (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
  return (
    <div className="rounded-full bg-gradient-to-br from-indigo to-cyan flex items-center justify-center font-display font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function LogoutConfirmModal({ open, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mx-auto mb-4">
          <Icon name="log-out" size={20} />
        </div>
        <h3 className="font-display text-lg font-medium mb-2">Are you sure you want to log out?</h3>
        <p className="text-sm text-mute mb-6">You'll need to log back in to see your Career Digital Twin.</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" className="!text-bad !border-bad/40 hover:!bg-bad/10" onClick={onConfirm}>Log Out</Button>
        </div>
      </div>
    </Modal>
  );
}

function ProfileDropdown({ profile, career, setView, onRequestLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const items = [
    { label: "My Profile", icon: "target", action: () => setView("profile") },
    { label: "Account Settings", icon: "settings", action: () => setView("settings") },
    { label: "Notifications", icon: "message-circle", action: () => setView("settings") },
    { label: "Target Career", icon: "briefcase", action: () => setView("career") },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors">
        <Avatar name={profile.name} size={30} />
        <span className="hidden sm:block text-sm text-left leading-tight">
          <span className="block text-ink/90">{profile.name || "Guest"}</span>
          <span className="block text-[11px] text-mute">{career?.name || "No career"}</span>
        </span>
        <Icon name="chevron-down" size={14} className="text-mute hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 glass-strong rounded-xl shadow-glow overflow-hidden z-40 fade-up">
          {items.map(it => (
            <button key={it.label} onClick={() => { it.action(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink/90 hover:bg-white/5 text-left">
              <Icon name={it.icon} size={14} className="text-mute" />{it.label}
            </button>
          ))}
          <div className="border-t border-line" />
          <button onClick={() => { setOpen(false); onRequestLogout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-bad hover:bg-bad/10 text-left">
            <Icon name="log-out" size={14} />Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- Profile page ----------------

function ProfilePage({ profile, setProfile, career, authUser, completedProjects, projectState }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const save = () => { setProfile(draft); setEditing(false); };
  const cancel = () => { setDraft(profile); setEditing(false); };

  const p = editing ? draft : profile;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <SectionTitle eyebrow="Profile" title="Your profile" />
        {!editing ? (
          <Button variant="secondary" icon="target" onClick={startEdit}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
            <Button onClick={save} icon="check">Save Changes</Button>
          </div>
        )}
      </div>

      <Card className="p-7 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={profile.name} size={64} />
          <div>
            <div className="font-display text-xl font-semibold">{profile.name || "Unnamed user"}</div>
            <div className="text-sm text-mute">{authUser?.email || "no email on file"}</div>
          </div>
        </div>

        {editing ? (
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Full name"><input className={inputCls} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></Field>
            <Field label="Education"><input className={inputCls} value={draft.education} onChange={e => setDraft(d => ({ ...d, education: e.target.value }))} /></Field>
            <Field label="Branch / Major"><input className={inputCls} value={draft.branch} onChange={e => setDraft(d => ({ ...d, branch: e.target.value }))} /></Field>
            <Field label="Graduation year"><input className={inputCls} type="number" value={draft.gradYear} onChange={e => setDraft(d => ({ ...d, gradYear: e.target.value }))} /></Field>
            <Field label="GitHub username"><input className={inputCls} value={draft.githubUsername} onChange={e => setDraft(d => ({ ...d, githubUsername: e.target.value }))} /></Field>
            <Field label="Experience level">
              <select className={inputCls} value={draft.experience} onChange={e => setDraft(d => ({ ...d, experience: e.target.value }))}>
                {EXPERIENCE_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5 text-sm">
            <div><div className="text-xs text-mute mb-1">Target career</div><div>{career?.name || "Not selected"}</div></div>
            <div><div className="text-xs text-mute mb-1">Education</div><div>{profile.education || "—"}</div></div>
            <div><div className="text-xs text-mute mb-1">Branch / Major</div><div>{profile.branch || "—"}</div></div>
            <div><div className="text-xs text-mute mb-1">Graduation year</div><div>{profile.gradYear || "—"}</div></div>
            <div><div className="text-xs text-mute mb-1">Experience</div><div>{EXPERIENCE_LEVELS.find(l => l.id === profile.experience)?.label || "—"}</div></div>
            <div><div className="text-xs text-mute mb-1">GitHub</div><div>{profile.githubUsername ? `@${profile.githubUsername}` : "Not connected"}</div></div>
          </div>
        )}
      </Card>

      <Card className="p-7 mb-6">
        <h3 className="font-display font-medium mb-4">Skills</h3>
        {editing ? (
          <SkillPicker value={draft.currentSkills}
            onChange={(names, selections) => setDraft(d => ({ ...d, currentSkills: names, skillSelections: selections }))} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.currentSkills.length ? profile.currentSkills.map(s => <Badge key={s} tone="indigo">{s}</Badge>) : <span className="text-sm text-mute">No skills added yet.</span>}
          </div>
        )}
      </Card>

      <Card className="p-7">
        <h3 className="font-display font-medium mb-4">Project evidence</h3>
        {(() => {
          const rows = Object.keys(projectState || {}).filter(id => PROJECT_BY_ID[id] && ["self-reported", "submitted", "verified"].includes(projectState[id].status));
          return rows.length ? (
            <div className="flex flex-wrap gap-2">
              {rows.map(id => { const st = projectState[id].status; return <Badge key={id} tone={st === "verified" ? "good" : st === "submitted" ? "indigo" : "warn"}>{st === "verified" && <Icon name="check" size={11} />}{PROJECT_BY_ID[id].name} · {st === "verified" ? "verified" : st === "submitted" ? "submitted" : "self-reported"}</Badge>; })}
            </div>
          ) : <span className="text-sm text-mute">No proof-of-skill projects submitted yet.</span>;
        })()}
      </Card>
    </div>
  );
}

// ---------------- Settings page ----------------

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: "target" },
  { id: "appearance", label: "Appearance", icon: "sparkles" },
  { id: "notifications", label: "Notifications", icon: "message-circle" },
  { id: "privacy", label: "Privacy", icon: "lock" },
  { id: "account", label: "Account", icon: "settings" },
];

function SettingsPage({ profile, authUser, setView, onRequestLogout, onClearData }) {
  const [tab, setTab] = useState("profile");
  const [reduceMotion, setReduceMotion] = useState(() => document.body.classList.contains("reduce-motion"));
  const [notifPrefs, setNotifPrefs] = useState({ product: true, evidence: true, marketing: false });
  const [cleared, setCleared] = useState(false);

  const toggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    document.body.classList.toggle("reduce-motion", next);
    try { localStorage.setItem("skillpilot:reduceMotion", next ? "1" : "0"); } catch (e) {}
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-10">
      <SectionTitle eyebrow="Settings" title="Account & preferences" />
      <div className="grid md:grid-cols-[180px_1fr] gap-6">
        <div className="flex md:flex-col gap-1 overflow-x-auto">
          {SETTINGS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-left transition-colors ${tab === t.id ? "bg-indigo/15 text-white border border-indigo/30" : "text-mute hover:text-ink hover:bg-white/5 border border-transparent"}`}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        <Card className="p-6 md:p-7">
          {tab === "profile" && (
            <div>
              <h3 className="font-display font-medium mb-2">Profile</h3>
              <p className="text-sm text-mute mb-5">Update your name, education, career and skills from the dedicated Profile page.</p>
              <Button onClick={() => setView("profile")} icon="target">Go to Profile</Button>
            </div>
          )}
          {tab === "appearance" && (
            <div>
              <h3 className="font-display font-medium mb-4">Appearance</h3>
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <div>
                  <div className="text-sm font-medium">Reduce motion</div>
                  <div className="text-xs text-mute mt-0.5">Turns off animations and transitions across the app.</div>
                </div>
                <button onClick={toggleReduceMotion} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${reduceMotion ? "bg-indigo" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${reduceMotion ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div>
              <h3 className="font-display font-medium mb-4">Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: "product", label: "Product updates", desc: "New features and improvements" },
                  { key: "evidence", label: "Evidence & scoring", desc: "GitHub, resume, assessment and project updates" },
                  { key: "marketing", label: "Tips & suggestions", desc: "Occasional career guidance" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between glass rounded-xl p-4">
                    <div>
                      <div className="text-sm font-medium">{n.label}</div>
                      <div className="text-xs text-mute mt-0.5">{n.desc}</div>
                    </div>
                    <button onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notifPrefs[n.key] ? "bg-indigo" : "bg-white/10"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifPrefs[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-mute mt-4">Preferences are saved locally in this demo build.</p>
            </div>
          )}
          {tab === "privacy" && (
            <div>
              <h3 className="font-display font-medium mb-4">Privacy</h3>
              <p className="text-sm text-mute leading-relaxed mb-3">
                This is a demo build. Your profile, evidence and progress are stored only in your browser's local storage —
                nothing is sent to a server or shared with anyone.
              </p>
              <p className="text-sm text-mute leading-relaxed">
                In a production deployment, this page would cover data retention, GitHub access scope, and account deletion requests.
              </p>
            </div>
          )}
          {tab === "account" && (
            <div>
              <h3 className="font-display font-medium mb-4">Account</h3>
              <div className="glass rounded-xl p-4 mb-5">
                <div className="text-xs text-mute mb-1">Signed in as</div>
                <div className="text-sm">{authUser?.email || "—"}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={onRequestLogout} icon="log-out">Log out</Button>
                <Button variant="outline" onClick={() => { onClearData(); setCleared(true); }} icon="refresh">Clear demo data</Button>
              </div>
              {cleared && <p className="text-xs text-good mt-3">Demo data cleared. Your twin will rebuild as you add evidence again.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
