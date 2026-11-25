const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "twin", label: "Digital Twin", icon: "target" },
  { id: "career", label: "Target Career", icon: "briefcase" },
  { id: "github", label: "GitHub Analyzer", icon: "github" },
  { id: "resume", label: "Resume Intelligence", icon: "file-text" },
  { id: "job", label: "Job Matcher", icon: "search" },
  { id: "assessment", label: "AI Assessment", icon: "brain-circuit" },
  { id: "interview", label: "AI Interview", icon: "message-circle" },
  { id: "projects", label: "Proof-of-Skill Projects", icon: "layers" },
  { id: "roadmap", label: "Roadmap", icon: "git-branch" },
  { id: "progress", label: "Progress", icon: "trending-up" },
  { id: "report", label: "Career Report", icon: "award" },
];

const PAGE_TITLES = { profile: "My Profile", settings: "Settings" };

function Shell({ view, setView, profile, readiness, children, onRequestLogout, notifications }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const career = CAREERS.find(c => c.id === profile.careerId);

  const SidebarContent = () => (
    <React.Fragment>
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center">
          <Icon name="target" size={17} className="text-white" />
        </div>
        <span className="font-display font-semibold tracking-tight">SkillPilot <span className="text-gradient">AI</span></span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${view === item.id ? "bg-indigo/15 text-white border border-indigo/30" : "text-mute hover:text-ink hover:bg-white/5 border border-transparent"}`}>
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-line">
        <button onClick={() => { setView("profile"); setMobileNavOpen(false); }} className="w-full flex items-center gap-3 px-1 mb-2 hover:bg-white/5 rounded-lg py-1.5 -mx-1 transition-colors">
          <Avatar name={profile.name} size={36} />
          <div className="min-w-0 text-left">
            <div className="text-sm font-medium truncate">{profile.name || "Guest"}</div>
            <div className="text-xs text-mute truncate">{career?.name || "No career selected"}</div>
          </div>
        </button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="flex-1 !justify-start" icon="settings" onClick={() => { setView("settings"); setMobileNavOpen(false); }}>Settings</Button>
          <Button variant="ghost" size="sm" className="flex-1 !justify-start !text-bad" icon="log-out" onClick={onRequestLogout}>Log out</Button>
        </div>
      </div>
    </React.Fragment>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-panel/60 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-panel border-r border-line flex flex-col fade-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <div className="h-16 border-b border-line flex items-center justify-between px-4 md:px-8 sticky top-0 bg-navy/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-mute" onClick={() => setMobileNavOpen(true)}>
              <Icon name="grid" size={20} />
            </button>
            <span className="text-sm text-mute hidden sm:block">
              {PAGE_TITLES[view] || NAV_ITEMS.find(n => n.id === view)?.label || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 chip rounded-full pl-3 pr-1 py-1">
              <span className="text-xs text-mute">Readiness</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${readiness >= 75 ? "bg-good/20 text-good" : readiness >= 45 ? "bg-warn/20 text-warn" : "bg-bad/20 text-bad"}`}>
                {readiness}/100
              </span>
            </div>
            <NotificationBell items={notifications} />
            <ProfileDropdown profile={profile} career={career} setView={setView} onRequestLogout={onRequestLogout} />
          </div>
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
