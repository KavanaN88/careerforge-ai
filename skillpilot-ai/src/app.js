function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable — demo still works, just won't persist */ }
}

function emptyProfile() {
  return {
    name: "", education: "", branch: "", gradYear: "", experience: "",
    currentSkills: [], skillSelections: [], careerId: "", careerLevel: "", secondaryCareers: [], recentCareers: [], githubUsername: "", resumeText: "", preferredTech: [],
  };
}

function genHistory(seedStr, currentValue) {
  const seed = hashString(seedStr);
  const months = MONTH_LABELS.slice(0, 5);
  let v = clampNum(seededRandomRange(seedStr + "start", 28, 46));
  const points = months.map((label, i) => {
    v = clampNum(v + seededRandomRange(seedStr + i, 4, 12));
    return { label, value: Math.min(v, currentValue) };
  });
  points.push({ label: "Now", value: currentValue });
  return points;
}

function App() {
  const [profile, setProfile] = useState(() => loadJSON("skillpilot:profile", emptyProfile()));
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadJSON("skillpilot:isAuthenticated", false));
  const [authUser, setAuthUser] = useState(() => loadJSON("skillpilot:authUser", null));

  const [githubData, setGithubData] = useState(() => loadJSON("skillpilot:githubData", null));
  const [resumeData, setResumeData] = useState(() => loadJSON("skillpilot:resumeData", null));
  const [assessmentResults, setAssessmentResults] = useState(() => loadJSON("skillpilot:assessmentResults", {}));
  const [assessmentHistory, setAssessmentHistory] = useState(() => loadJSON("skillpilot:assessmentHistory", []));
  const [interviewHistory, setInterviewHistory] = useState(() => loadJSON("skillpilot:interviewHistory", []));
  const [interviewResult, setInterviewResult] = useState(() => loadJSON("skillpilot:interviewResult", null));
  const [completedProjects, setCompletedProjects] = useState(() => loadJSON("skillpilot:completedProjects", []));
  const [projectState, setProjectState] = useState(() => sanitizeProjectState(loadJSON("skillpilot:projectState", {})));

  const [stage, setStage] = useState(() => {
    const auth = loadJSON("skillpilot:isAuthenticated", false);
    const prof = loadJSON("skillpilot:profile", emptyProfile());
    if (auth && prof.careerId) return "app";
    if (auth) return "onboarding";
    return "landing";
  });
  const [view, setView] = useState("dashboard");
  const [, setApiChecked] = useState(false);   // re-render once backend detection finishes
  const [syncOn, setSyncOn] = useState(false);   // true once a signed-in user's data is loaded from the server
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Hydrate the manual "reduce motion" preference once on mount.
  useEffect(() => {
    try {
      if (localStorage.getItem("skillpilot:reduceMotion") === "1") document.body.classList.add("reduce-motion");
    } catch (e) { /* ignore */ }
  }, []);

  // Apply a state document from the server to React state (server is the source of truth when signed in).
  const applyServerState = (st) => {
    setProfile({ ...emptyProfile(), ...st.profile });
    setGithubData(st.githubData || null);
    setResumeData(st.resumeData || null);
    setAssessmentResults(st.assessmentResults || {});
    setAssessmentHistory(Array.isArray(st.assessmentHistory) ? st.assessmentHistory : []);
    setInterviewResult(st.interviewResult || null);
    setInterviewHistory(Array.isArray(st.interviewHistory) ? st.interviewHistory : []);
    setCompletedProjects(st.completedProjects || []);
    setProjectState(sanitizeProjectState(st.projectState));
  };

  // Detect the backend once; if a saved token exists, restore the session from the database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const up = await API.detect();
      if (!cancelled) setApiChecked(true);
      if (!up || !API.token || cancelled) return;
      try {
        const [{ user }, st] = await Promise.all([API.me(), API.loadState()]);
        if (cancelled) return;
        applyServerState(st);
        setAuthUser({ email: user.email }); setIsAuthenticated(true); setSyncOn(true);
        setStage(s => (s === "login" || s === "signup") ? s : (st.profile.careerId ? "app" : "onboarding"));
      } catch (e) {
        if (e.status === 401) { API.setToken(null); setIsAuthenticated(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Push changes to PostgreSQL (debounced) while signed in to the backend.
  useEffect(() => {
    if (!syncOn || !API.available || !API.token) return;
    const t = setTimeout(() => {
      API.saveState({ profile, githubData, resumeData, assessmentResults, assessmentHistory, interviewResult, interviewHistory, completedProjects, projectState }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [syncOn, profile, githubData, resumeData, assessmentResults, assessmentHistory, interviewResult, interviewHistory, completedProjects, projectState]);

  // Persist everything relevant so a page refresh doesn't lose the session or the twin.
  useEffect(() => saveJSON("skillpilot:profile", profile), [profile]);
  useEffect(() => saveJSON("skillpilot:isAuthenticated", isAuthenticated), [isAuthenticated]);
  useEffect(() => saveJSON("skillpilot:authUser", authUser), [authUser]);
  useEffect(() => saveJSON("skillpilot:githubData", githubData), [githubData]);
  useEffect(() => saveJSON("skillpilot:resumeData", resumeData), [resumeData]);
  useEffect(() => saveJSON("skillpilot:assessmentResults", assessmentResults), [assessmentResults]);
  useEffect(() => saveJSON("skillpilot:assessmentHistory", assessmentHistory), [assessmentHistory]);
  useEffect(() => saveJSON("skillpilot:interviewResult", interviewResult), [interviewResult]);
  useEffect(() => saveJSON("skillpilot:interviewHistory", interviewHistory), [interviewHistory]);
  // Interview evidence: aggregate of recent interviews (level-weighted); falls back to a legacy single result.
  const interviewAgg = useMemo(() => interviewAggregate(interviewHistory) || interviewResult, [interviewHistory, interviewResult]);
  useEffect(() => saveJSON("skillpilot:completedProjects", completedProjects), [completedProjects]);
  useEffect(() => saveJSON("skillpilot:projectState", projectState), [projectState]);

  const career = CAREERS.find(c => c.id === profile.careerId) || CAREERS[0];

  // ---- Evidence map + skill confidence (the core "Digital Twin" computation) ----
  // Only skills DETECTED in a verified project count; self-reported/legacy completion earns nothing.
  const projectEvidence = useMemo(() => projectEvidenceSkills(projectState), [projectState]);
  const evidenceMap = useMemo(() => {
    const map = {};
    const claimCtx = claimContext(profile.currentSkills);
    career.skills.forEach(s => {
      const claimed = isSkillClaimed(s, claimCtx);
      map[s.id] = {
        skillId: s.id,
        resumeMention: resumeData ? resumeData.matched.some(m => m.id === s.id) : false,
        githubProject: githubData ? githubData.evidencedSkills.includes(s.id) : false,
        deploymentEvidence: projectEvidence.verified.has(s.id),
        assessmentScore: assessmentResults[s.id] ?? null,
        interviewScore: interviewHistory.length ? interviewSkillEvidence(interviewHistory, s.id) : (interviewResult ? Math.round(interviewResult.scores.technical / 10) : null),
        claimedOnly: claimed,
      };
    });
    return map;
  }, [career, profile.currentSkills, resumeData, githubData, projectEvidence, assessmentResults, interviewResult, interviewHistory]);

  const skillState = useMemo(() => {
    const state = {};
    career.skills.forEach(s => { state[s.id] = computeSkillConfidence(evidenceMap[s.id]); });
    return state;
  }, [career, evidenceMap]);

  const subScores = useMemo(() => {
    const skillConfidenceAvg = career.skills.length
      ? career.skills.reduce((sum, s) => sum + (skillState[s.id]?.score ?? 0), 0) / career.skills.length : 0;
    const assessedSkills = career.skills.filter(s => assessmentResults[s.id] !== undefined);
    const assessmentAvg = assessedSkills.length
      ? assessedSkills.reduce((sum, s) => sum + assessmentResults[s.id] * 10, 0) / assessedSkills.length : 0;
    const projectCoveredSkills = career.skills.filter(s => evidenceMap[s.id]?.deploymentEvidence).length;
    return {
      skillConfidenceAvg,
      githubScore: githubData?.portfolioScore ?? 0,
      resumeMatch: resumeData?.matchPct ?? 0,
      projectEvidencePct: career.skills.length ? (projectCoveredSkills / career.skills.length) * 100 : 0,
      assessmentAvg,
      interviewAvg: interviewAgg ? (interviewAgg.scores.technical + interviewAgg.scores.communication + interviewAgg.scores.problemSolving) / 3 : 0,
    };
  }, [career, skillState, assessmentResults, githubData, resumeData, evidenceMap, interviewAgg]);

  const readiness = useMemo(() => computeReadiness(subScores), [subScores]);
  const nba = useMemo(() => nextBestAction(career, skillState, projectsForCareer(career)), [career, skillState]);

  const notifications = useMemo(() => {
    const items = [];
    if (githubData) items.push({ icon: "github", text: "Your GitHub analysis is complete.", tone: "cyan" });
    if (resumeData) items.push({ icon: "file-text", text: "Your resume was analyzed against your target career.", tone: "indigo" });
    const vp = Object.keys(projectState).filter(id => projectState[id].status === "verified" && PROJECT_BY_ID[id]);
    if (vp.length) items.push({ icon: "layers", text: `"${PROJECT_BY_ID[vp[vp.length - 1]].name}" was independently verified and your evidence was updated.`, tone: "good" });
    if (Object.keys(assessmentResults).length > 0) items.push({ icon: "brain-circuit", text: "New assessment result added to your Career Digital Twin.", tone: "cyan" });
    if (nba) items.push({ icon: "zap", text: `New proof-of-skill project available for ${nba.skill.name}.`, tone: "indigo" });
    return items;
  }, [githubData, resumeData, projectState, assessmentResults, nba]);

  const historySeed = (profile.name || "guest") + career.id;
  const history = useMemo(() => genHistory(historySeed, readiness), [historySeed, readiness]);
  const subScoreHistory = useMemo(() => ({
    skillConfidenceAvg: genHistory(historySeed + "sc", subScores.skillConfidenceAvg),
    githubScore: genHistory(historySeed + "gh", subScores.githubScore),
    assessmentAvg: genHistory(historySeed + "as", subScores.assessmentAvg),
    interviewAvg: genHistory(historySeed + "iv", subScores.interviewAvg),
  }), [historySeed, subScores]);

  // ---- Handlers ----
  const handleGithubAnalyze = (username) => setGithubData(analyzeGithub(username, career.skills));
  const handleResumeAnalyze = (text) => setResumeData(analyzeResume(text, career));
  // A finished attempt: append to history and store the composite 0-10 evidence score for the skill.
  // In backend mode the server has already merged the same values into the database.
  const handleAttemptComplete = ({ entry, score10, serverState }) => {
    if (serverState && serverState.assessmentHistory) {
      setAssessmentHistory(serverState.assessmentHistory); setAssessmentResults(serverState.assessmentResults || {});
    } else {
      setAssessmentHistory(prev => [...prev, entry].slice(-500));
      setAssessmentResults(prev => ({ ...prev, [entry.skillId]: score10 }));
    }
  };
  const handleInterviewComplete = (entry) => setInterviewHistory(prev => [...prev, entry].slice(-60));
  const handleProjectSubmit = (projectId) => setCompletedProjects(prev => prev.includes(projectId) ? prev : [...prev, projectId]);
  const handleChangeCareer = (careerId) => setProfile(p => ({ ...p, careerId }));

  const handleGetStartedFromLanding = () => {
    if (isAuthenticated && profile.careerId) { setStage("app"); setView("dashboard"); }
    else if (isAuthenticated) { setStage("onboarding"); }
    else { setStage("signup"); }
  };

  const handleLogin = async ({ email, password }) => {
    if (API.available) {
      try {
        const { token, user } = await API.login(email, password);
        API.setToken(token);
        const st = await API.loadState();
        applyServerState(st);
        setAuthUser({ email: user.email }); setIsAuthenticated(true); setSyncOn(true);
        if (st.profile.name && st.profile.careerId) { setStage("app"); setView("dashboard"); }
        else { setStage("onboarding"); }
        return;
      } catch (e) { return e.message || "Could not log in."; }
    }
    await new Promise(r => setTimeout(r, 500));   // demo mode (no backend)
    setIsAuthenticated(true);
    setAuthUser({ email });
    if (profile.name && profile.careerId) { setStage("app"); setView("dashboard"); }
    else { setStage("onboarding"); }
  };

  const handleSignup = async ({ name, email, password }) => {
    if (API.available) {
      try {
        const { token, user } = await API.signup(name, email, password);
        API.setToken(token);
        applyServerState({ profile: { ...emptyProfile(), name } });
        setAuthUser({ email: user.email }); setIsAuthenticated(true); setSyncOn(true);
        setStage("onboarding");
        return;
      } catch (e) { return e.message || "Could not create the account."; }
    }
    await new Promise(r => setTimeout(r, 500));   // demo mode (no backend)
    setAuthUser({ email });
    setProfile(p => ({ ...p, name }));
    setIsAuthenticated(true);
    setStage("onboarding");
  };

  const requestLogout = () => setLogoutConfirmOpen(true);
  const confirmLogout = () => {
    setSyncOn(false); API.setToken(null);
    setIsAuthenticated(false);
    setLogoutConfirmOpen(false);
    setStage("landing");
    setView("dashboard");
  };

  const handleClearDemoData = () => {
    setGithubData(null); setResumeData(null); setAssessmentResults({}); setAssessmentHistory([]); setInterviewResult(null); setInterviewHistory([]); setCompletedProjects([]); setProjectState({});
  };

  const handleOnboardingComplete = () => {
    if (profile.githubUsername) setGithubData(analyzeGithub(profile.githubUsername, career.skills));
    if (profile.resumeText) setResumeData(analyzeResume(profile.resumeText, career));
    setStage("app");
    setView("dashboard");
  };

  if (stage === "landing") {
    return <Landing onGetStarted={handleGetStartedFromLanding} onLogin={() => setStage("login")} />;
  }

  if (stage === "login") {
    return <Login onLogin={handleLogin} onGoSignup={() => setStage("signup")} onBackHome={() => setStage("landing")} />;
  }

  if (stage === "signup") {
    return <Signup onSignup={handleSignup} onGoLogin={() => setStage("login")} onBackHome={() => setStage("landing")} />;
  }

  if (stage === "onboarding") {
    return <Onboarding profile={profile} setProfile={setProfile} onComplete={handleOnboardingComplete} />;
  }

  const assistantCtx = { career, skillState, nba, readiness, githubData, resumeData, subScores };

  return (
    <Shell view={view} setView={setView} profile={profile} readiness={Math.round(readiness)} onRequestLogout={requestLogout} notifications={notifications}>
      {view === "dashboard" && (
        <Dashboard profile={profile} career={career} skillState={skillState} subScores={subScores} readiness={Math.round(readiness)}
          nba={nba} setView={setView} githubData={githubData} resumeData={resumeData}
          hasAssessment={Object.keys(assessmentResults).length > 0} hasInterview={!!interviewAgg}
          hasProject={projectEvidence.verified.size > 0 || Object.values(projectState).some(e => e.status === "submitted" || e.status === "verified")} />
      )}
      {view === "twin" && (
        <DigitalTwin career={career} skillState={skillState} evidenceMap={evidenceMap} setView={setView} />
      )}
      {view === "career" && (
        <CareerSelectPage profile={profile} setProfile={setProfile} onChangeCareer={handleChangeCareer} skillState={skillState} readiness={Math.round(readiness)} setView={setView} />
      )}
      {view === "github" && (
        <GithubAnalyzer career={career} username={profile.githubUsername}
          setUsername={(u) => setProfile(p => ({ ...p, githubUsername: u }))}
          githubData={githubData} onAnalyze={handleGithubAnalyze} />
      )}
      {view === "resume" && (
        <ResumeIntel career={career} resumeText={profile.resumeText}
          setResumeText={(t) => setProfile(p => ({ ...p, resumeText: t }))}
          resumeData={resumeData} onAnalyze={handleResumeAnalyze} />
      )}
      {view === "job" && (
        <JobAnalyzer career={career} skillState={skillState} setView={setView} />
      )}
      {view === "assessment" && (
        <Assessment career={career} skillState={skillState} assessmentResults={assessmentResults} assessmentHistory={assessmentHistory} onAttemptComplete={handleAttemptComplete} />
      )}
      {view === "interview" && (
        <Interview profile={profile} career={career} githubData={githubData} resumeData={resumeData} history={interviewHistory} onComplete={handleInterviewComplete} lastResult={interviewResult?.scores} />
      )}
      {view === "projects" && (
        <Projects profile={profile} career={career} skillState={skillState} assessmentResults={assessmentResults} githubData={githubData} resumeData={resumeData} projectState={projectState} setProjectState={setProjectState} completedProjects={completedProjects} setView={setView} />
      )}
      {view === "roadmap" && (
        <Roadmap career={career} skillState={skillState} setView={setView} profile={profile} />
      )}
      {view === "progress" && (
        <Progress history={history} subScoreHistory={subScoreHistory} />
      )}
      {view === "report" && (
        <Report profile={profile} career={career} skillState={skillState} readiness={Math.round(readiness)} nba={nba} subScores={subScores} />
      )}
      {view === "profile" && (
        <ProfilePage profile={profile} setProfile={setProfile} career={career} authUser={authUser} completedProjects={completedProjects} projectState={projectState} />
      )}
      {view === "settings" && (
        <SettingsPage profile={profile} authUser={authUser} setView={setView} onRequestLogout={requestLogout} onClearData={handleClearDemoData} />
      )}
      <Assistant {...assistantCtx} />
      <LogoutConfirmModal open={logoutConfirmOpen} onCancel={() => setLogoutConfirmOpen(false)} onConfirm={confirmLogout} />
    </Shell>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
