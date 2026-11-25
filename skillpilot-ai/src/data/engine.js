// SkillPilot AI — scoring engine (demo mode)
// Mirrors what the real product computes server-side (FastAPI + Gemini API).
// Every function here is deterministic and explainable — no black box, matching
// the product's "evidence, not vibes" principle.

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed) {
  // simple mulberry32
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Evidence-based confidence score for a single skill.
 * Weighted blend: resume mention, github evidence, deployment/project evidence,
 * assessment score (0-10), interview score (0-10).
 */
function computeSkillConfidence(evidence) {
  const {
    resumeMention = false,
    githubProject = false,
    deploymentEvidence = false,
    assessmentScore = null, // 0-10
    interviewScore = null, // 0-10
    claimedOnly = false,
  } = evidence;

  if (claimedOnly && !resumeMention && !githubProject && !deploymentEvidence && assessmentScore === null && interviewScore === null) {
    return { score: clamp(seededRandomRange(evidence.skillId || "x", 10, 25)), breakdown: [] };
  }

  let score = 0;
  const breakdown = [];

  if (resumeMention) { score += 15; breakdown.push({ label: "Mentioned in resume", delta: 15, positive: true }); }
  if (githubProject) { score += 20; breakdown.push({ label: "Used in a GitHub project", delta: 20, positive: true }); }
  if (deploymentEvidence) { score += 20; breakdown.push({ label: "Real deployment / working demo detected", delta: 20, positive: true }); }
  if (assessmentScore !== null) {
    const pts = Math.round((assessmentScore / 10) * 25);
    score += pts;
    breakdown.push({ label: `Technical assessment: ${assessmentScore}/10`, delta: pts, positive: assessmentScore >= 5 });
  }
  if (interviewScore !== null) {
    const pts = Math.round((interviewScore / 10) * 20);
    score += pts;
    breakdown.push({ label: `AI interview: ${interviewScore}/10`, delta: pts, positive: interviewScore >= 5 });
  }

  if (breakdown.length === 0) {
    breakdown.push({ label: "No evidence submitted yet", delta: 0, positive: false });
  }

  return { score: clamp(score), breakdown };
}

function seededRandomRange(seedStr, min, max) {
  const r = seededRandom(hashString(String(seedStr)));
  return min + r * (max - min);
}

function strengthLabel(score) {
  if (score >= 75) return { label: "Strong", color: "good" };
  if (score >= 45) return { label: "Developing", color: "warn" };
  return { label: "Weak", color: "bad" };
}

/**
 * Simulated GitHub analysis. Deterministic per-username so the same
 * username always yields the same "AI analysis" in this demo.
 */
function analyzeGithub(username, careerSkills) {
  const seed = hashString(username.toLowerCase().trim());
  const rnd = (i) => seededRandom(seed + i * 97);

  const repoCount = Math.round(4 + rnd(1) * 28);
  const activityScore = clamp(30 + rnd(2) * 65);
  const docQuality = clamp(30 + rnd(3) * 65);
  const techDiversity = clamp(30 + rnd(4) * 65);
  const projectQuality = clamp(25 + rnd(6) * 70);
  const deploymentEvidenceScore = clamp(15 + rnd(7) * 65); // weakest signal for most portfolios, deliberately
  const languages = ["Python", "JavaScript", "TypeScript", "Go", "Java", "C++", "Shell"]
    .filter((_, i) => rnd(5 + i) > 0.4)
    .slice(0, 5);
  if (languages.length === 0) languages.push("Python");

  const portfolioScore = clamp(
    activityScore * 0.22 + docQuality * 0.18 + techDiversity * 0.18 + projectQuality * 0.22 + deploymentEvidenceScore * 0.1
    + Math.min(repoCount, 20) / 20 * 100 * 0.1
  );

  // Which of the target career's skills does this "portfolio" provide evidence for?
  const evidencedSkills = careerSkills.filter((s, i) => rnd(20 + i) > 0.45).map(s => s.id);

  const sampleProjectNames = ["CloudDeploy", "TaskFlow API", "DataViz Dashboard", "AuthGateway", "InsightPipeline", "EdgeCache"];
  const projects = Array.from({ length: Math.min(3, Math.max(1, Math.round(repoCount / 8))) }).map((_, i) => {
    const evidence = careerSkills.filter((s, j) => rnd(50 + i * 10 + j) > 0.5).map(s => s.name);
    return {
      name: sampleProjectNames[(seed + i) % sampleProjectNames.length],
      stars: Math.round(rnd(70 + i) * 40),
      evidence: evidence.length ? evidence : [careerSkills[0]?.name].filter(Boolean),
    };
  });

  return {
    repoCount,
    activityScore,
    docQuality,
    techDiversity,
    projectQuality,
    deploymentEvidenceScore,
    portfolioScore,
    languages,
    evidencedSkills,
    projects,
  };
}

/**
 * Simulated resume parsing: keyword match against career skill names.
 */
function analyzeResume(resumeText, career) {
  const text = (resumeText || "").toLowerCase();
  const matched = [];
  const missing = [];
  career.skills.forEach(skill => {
    const hit = text.includes(skill.name.toLowerCase()) || text.includes(skill.id.toLowerCase());
    if (hit) matched.push(skill); else missing.push(skill);
  });
  const matchPct = career.skills.length ? clamp((matched.length / career.skills.length) * 100) : 0;

  // crude extraction of "achievements": lines with numbers/%
  const achievementLines = (resumeText || "")
    .split(/\n|\.(?=\s|$)/)
    .map(l => l.trim())
    .filter(l => /\d/.test(l) && l.length > 15 && l.length < 160)
    .slice(0, 3);

  return { matched, missing, matchPct, achievementLines };
}

/**
 * Simulated job description analysis: keyword extraction + comparison to twin.
 */
function analyzeJobDescription(jdText, career, skillState) {
  const text = (jdText || "").toLowerCase();
  const required = [];
  const preferred = [];
  career.skills.forEach(skill => {
    const mentioned = text.includes(skill.name.toLowerCase()) || text.includes(skill.id.toLowerCase());
    if (!mentioned) return;
    // crude heuristic: "preferred"/"nice to have"/"bonus" near the mention => preferred
    const idx = text.indexOf(skill.name.toLowerCase());
    const window = text.slice(Math.max(0, idx - 40), idx + 40);
    if (/preferred|nice to have|bonus|plus/.test(window)) preferred.push(skill);
    else required.push(skill);
  });
  if (required.length === 0 && preferred.length === 0) {
    // fallback: use full skill list as "required" so the page isn't empty
    required.push(...career.skills.slice(0, 5));
  }

  const evaluate = (skill) => {
    const conf = skillState[skill.id]?.score ?? 0;
    if (conf >= 70) return "strong";
    if (conf >= 40) return "partial";
    return "missing";
  };

  const all = [...required, ...preferred];
  const scored = all.map(s => ({ skill: s, status: evaluate(s) }));
  const strong = scored.filter(s => s.status === "strong");
  const partial = scored.filter(s => s.status === "partial");
  const missing = scored.filter(s => s.status === "missing");

  const matchPct = all.length
    ? clamp((strong.length * 1 + partial.length * 0.5) / all.length * 100)
    : 0;

  return { required, preferred, strong, partial, missing, matchPct };
}

/**
 * Career readiness = weighted rollup of the twin's sub-scores.
 */
function computeReadiness({ skillConfidenceAvg, githubScore, resumeMatch, projectEvidencePct, assessmentAvg, interviewAvg }) {
  const weights = {
    skillConfidenceAvg: 0.28,
    githubScore: 0.15,
    resumeMatch: 0.12,
    projectEvidencePct: 0.2,
    assessmentAvg: 0.15,
    interviewAvg: 0.1,
  };
  const vals = { skillConfidenceAvg, githubScore, resumeMatch, projectEvidencePct, assessmentAvg, interviewAvg };
  let total = 0;
  Object.keys(weights).forEach(k => { total += (vals[k] || 0) * weights[k]; });
  return clamp(total);
}

/**
 * Splits evidence into "Knowledge" (can you explain/demonstrate understanding —
 * assessment + interview) vs "Proof" (can you show it exists in the world —
 * resume + GitHub + deployment). Knowing something and proving it are different,
 * and the twin should be honest about which one is thin.
 */
function computeKnowledgeProof(evidence) {
  let knowledgeSum = 0, knowledgeCount = 0;
  if (evidence.assessmentScore !== null) { knowledgeSum += evidence.assessmentScore * 10; knowledgeCount++; }
  if (evidence.interviewScore !== null) { knowledgeSum += evidence.interviewScore * 10; knowledgeCount++; }
  const knowledge = knowledgeCount ? clamp(knowledgeSum / knowledgeCount) : 0;

  const proof = (evidence.resumeMention ? 20 : 0) + (evidence.githubProject ? 35 : 0) + (evidence.deploymentEvidence ? 45 : 0);

  return { knowledge, proof: clamp(proof) };
}

/**
 * Explains a Career Readiness score as weighted point contributions from each
 * sub-score, so "78/100" is never a black box.
 */
function readinessBreakdown(subScores) {
  const weights = { skillConfidenceAvg: 0.28, githubScore: 0.15, resumeMatch: 0.12, projectEvidencePct: 0.2, assessmentAvg: 0.15, interviewAvg: 0.10 };
  const labels = { skillConfidenceAvg: "Skills", githubScore: "GitHub", resumeMatch: "Resume Match", projectEvidencePct: "Projects", assessmentAvg: "Assessment", interviewAvg: "Interview" };
  return Object.keys(weights).map(k => ({
    key: k,
    label: labels[k],
    weightPct: Math.round(weights[k] * 100),
    rawScore: Math.round(subScores[k] || 0),
    points: Math.round((subScores[k] || 0) * weights[k]),
  }));
}

/**
 * Generates the "Next Best Action" — picks the highest-leverage weak skill
 * (high weight in career graph, low confidence) and a project that proves it.
 */
function nextBestAction(career, skillState, projectTemplates) {
  const ranked = [...career.skills]
    .map(s => ({ skill: s, conf: skillState[s.id]?.score ?? 0 }))
    .sort((a, b) => (b.skill.weight - a.skill.weight * (b.conf / 100)) - (a.skill.weight - a.skill.weight * (a.conf / 100)));

  // simpler: weight * (1 - confidence/100), descending
  const target = [...career.skills]
    .map(s => ({ skill: s, conf: skillState[s.id]?.score ?? 0 }))
    .map(x => ({ ...x, leverage: x.skill.weight * (1 - x.conf / 100) }))
    .sort((a, b) => b.leverage - a.leverage)[0];

  if (!target) return null;

  const project = projectTemplates.find(p => p.skills.includes(target.skill.id)) || projectTemplates[0];

  return {
    skill: target.skill,
    confidence: target.conf,
    project,
    message: `${target.skill.name} is important for your target role, but your current evidence is ${target.conf < 40 ? "weak" : "moderate"}.`,
  };
}
