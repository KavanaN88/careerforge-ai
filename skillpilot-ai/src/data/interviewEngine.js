// ============================================================================
// INTERVIEW ENGINE — isomorphic (browser bundle + Node). No LLM is called: questions are generated from
// the career catalogue + curated banks, and answers are evaluated by a transparent, rule-based rubric
// (concept coverage, reasoning, structure, example/practicality, completeness). JavaScript solutions in the
// coding interview are really executed against hidden tests; other languages get static analysis only.
// The interface (startInterview / submitTurn / buildInterviewReport) is the seam where an LLM evaluator
// could later be plugged in server-side.
// ============================================================================
const INTERVIEW_CATEGORIES = [
  { id: "technical", label: "Technical", icon: "brain-circuit", desc: "Programming, DSA, OOP, DBMS, OS, networks, frameworks and cloud fundamentals." },
  { id: "project", label: "Project-based", icon: "layers", desc: "Deep dive into your GitHub and resume projects — only from real evidence." },
  { id: "hr", label: "HR", icon: "message-circle", desc: "Self-introduction, teamwork, leadership, conflict and workplace scenarios." },
  { id: "role", label: "Role-specific", icon: "briefcase", desc: "Scenarios generated from your target career's actual skills and responsibilities." },
  { id: "coding", label: "Coding", icon: "terminal", desc: "Real coding problems, output prediction, debugging and complexity." },
  { id: "design", label: "System Design", icon: "server", desc: "High-level and low-level design, scalability, caching, fault tolerance, security." },
];
const INTERVIEW_CATEGORY_BY_ID = {}; INTERVIEW_CATEGORIES.forEach(c => { INTERVIEW_CATEGORY_BY_ID[c.id] = c; });
const INTERVIEW_LEVEL_IDS = ["basic", "intermediate", "advanced"];
const INTERVIEW_LEVEL_LABEL = { basic: "Basic", intermediate: "Intermediate", advanced: "Advanced" };
const INTERVIEW_LEVEL_DESC = {
  basic: "Introductory questions, fundamentals and simple examples.",
  intermediate: "Practical scenarios, implementation, debugging and application questions.",
  advanced: "Complex real-world scenarios, architecture, optimisation, security and production troubleshooting.",
};
// [questions, minutes] defaults per category and level
const INTERVIEW_DEFAULTS = {
  technical: { basic: [5, 15], intermediate: [6, 25], advanced: [8, 40] },
  project:   { basic: [4, 15], intermediate: [5, 25], advanced: [6, 35] },
  hr:        { basic: [4, 12], intermediate: [5, 20], advanced: [6, 30] },
  role:      { basic: [5, 15], intermediate: [6, 25], advanced: [8, 40] },
  coding:    { basic: [3, 25], intermediate: [3, 40], advanced: [3, 60] },
  design:    { basic: [3, 20], intermediate: [4, 35], advanced: [5, 50] },
};
const INTERVIEW_LEVEL_FACTOR = { basic: 0.8, intermediate: 0.92, advanced: 1 };   // a Basic round is weaker evidence than an Advanced one

function defaultInterviewConfig(careerId, category, level) {
  const d = (INTERVIEW_DEFAULTS[category] || INTERVIEW_DEFAULTS.technical)[level] || [5, 15];
  return { careerId, category, level, language: "javascript", questions: d[0], minutes: d[1], mode: "text" };
}
function normalizeInterviewConfig(c) {
  const cat = INTERVIEW_CATEGORY_BY_ID[c && c.category] ? c.category : "technical";
  const level = INTERVIEW_LEVEL_IDS.includes(c && c.level) ? c.level : "basic";
  const base = defaultInterviewConfig(c && c.careerId, cat, level);
  const num = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  return { ...base, ...(c || {}), category: cat, level,
    language: CODE_LANGUAGES.some(l => l.id === (c && c.language)) ? c.language : "javascript",
    questions: num(c && c.questions, 1, 15, base.questions), minutes: num(c && c.minutes, 5, 120, base.minutes),
    mode: c && c.mode === "voice" ? "voice" : "text" };
}

// ---------------------------------------------------------------- helpers
const _esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const _STOP = new Set("this that with from have what when where which would could should about their there these those into your than then them they were been being also only just very more most such some does doing used uses using make made like each other over under between because while after before without within through during across against both either neither".split(" "));
const _rx = {};
function _test(frag, text) {
  let r = _rx[frag];
  if (!r) { try { r = _rx[frag] = new RegExp("(?:^|[^a-z0-9])(?:" + frag + ")", "i"); } catch (e) { r = _rx[frag] = /$^/; } }
  return r.test(text);
}
function _terms(text, n) {
  const seen = new Set(), out = [];
  String(text || "").toLowerCase().replace(/[^a-z0-9+#.\- ]/g, " ").split(/\s+/).forEach(w => {
    w = w.replace(/^[.\-]+|[.\-]+$/g, "");
    if (w.length < 4 || _STOP.has(w) || /^\d+$/.test(w)) return;
    const stem = w.length > 6 ? w.replace(/(ing|ed|es|s)$/, "") : w;
    if (seen.has(stem)) return; seen.add(stem); out.push(stem);
  });
  return out.slice(0, n);
}
const _termConcepts = (text, n, hint) => _terms(text, n).map(t => cpt(t, _esc(t), hint || ""));
const _shuf = (arr, seed) => { const a = arr.slice(), b = hashString(String(seed)); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seededRandom(b + i * 7919) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const _pickOne = (arr, seed) => arr[Math.floor(seededRandom(hashString(String(seed))) * arr.length)];

// ---------------------------------------------------------------- question construction
function _asQuestion(base, extra) {
  return { kind: "primary", type: "concept", deeper: null, expectWords: 40, ...base, ...extra };
}
function _genericSkillQuestion(skillId, level, career) {
  const s = SKILL_LIB[skillId]; if (!s) return null;
  const careerName = career ? career.name : "your target role";
  const nameC = cpt(s.name, _esc(s.name.toLowerCase().replace(/\s*\(.*\)/, "")).replace(/\\\//g, "|"), `Refer to ${s.name} explicitly.`, 0.6);
  const purposeC = _termConcepts(s.purpose, 3, `Relates to ${s.purpose}.`);
  if (level === "basic") return { topic: s.name, q: `What is ${s.name}, and what is it typically used for?`, concepts: [nameC, ...purposeC], ideal: `${s.name} is used for ${s.purpose}.` };
  if (level === "intermediate") return { topic: s.name, q: `Describe how you would use ${s.name} in a real ${careerName} project that involves ${s.purpose}. What problems could you run into, and how would you handle them?`, concepts: [nameC, ...purposeC.slice(0, 2), cpt("problems and handling", "problem|issue|error|fail|bug|challenge|risk", "Name concrete problems."), cpt("how you'd handle them", "test|monitor|log|fix|handle|fallback|validate|retry|document", "Say how you'd handle them."), GENERIC_CONCEPTS.example[0]], expectWords: 55, ideal: `Use ${s.name} for ${s.purpose}; anticipate failures and handle them with testing and monitoring.` };
  return { topic: s.name, q: `A production ${careerName} system that depends on ${s.name} starts failing under load. Walk me through how you would diagnose and fix it, and how you'd prevent it from recurring.`, concepts: [nameC, ...GENERIC_CONCEPTS.troubleshoot], expectWords: 70, ideal: "Reproduce/isolate, check logs and metrics, find root cause, mitigate (rollback), then prevent with tests, alerts and runbooks." };
}
function _qbankQuestion(skillId, level, seed) {
  const bank = (typeof QBANK !== "undefined" && QBANK[skillId] && QBANK[skillId][level]) || [];
  const list = bank.filter(x => x.type !== "tf");
  if (!list.length) return null;
  const it = _pickOne(list, seed + skillId + level);
  const idx = Array.isArray(it.answer) ? it.answer : [it.answer];
  const correct = idx.map(i => it.options[i]).join(" ; ");
  const s = SKILL_LIB[skillId];
  let q, concepts;
  if (it.type === "output") {
    q = `${it.q} Explain your reasoning.`;
    concepts = [cpt("correct output", _esc(correct).replace(/\s+/g, "\\s*"), it.explain, 2), ..._termConcepts(it.explain, 3, it.explain)];
  } else {
    q = `${it.q}\n\nOptions: ${it.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join("   ")}\n\nChoose the best option and justify it.`;
    concepts = [..._termConcepts(correct, 2, it.explain), ..._termConcepts(it.explain, 3, it.explain)];
  }
  if (!concepts.length) return null;
  return { topic: (s ? s.name : skillId) + " · " + (it.topic || ""), q, code: it.code || null, concepts, ideal: `${correct}. ${it.explain}`, expectWords: 30, type: it.type === "output" || it.type === "debug" ? "code-reason" : "concept" };
}
// One interview question for a skill: curated → converted from the assessment bank → generated (works for every skill).
function skillInterviewQuestion(skillId, level, career, seed) {
  const s = SKILL_LIB[skillId]; if (!s) return null;
  const cur = INTERVIEW_SKILLS[skillId] && INTERVIEW_SKILLS[skillId][level];
  const nextLevel = INTERVIEW_LEVEL_IDS[INTERVIEW_LEVEL_IDS.indexOf(level) + 1];
  let base, src;
  if (cur) { base = { ...cur, expectWords: 45 }; src = "curated"; }
  else { base = _qbankQuestion(skillId, level, seed) || null; src = base ? "bank" : "generated"; if (!base) base = _genericSkillQuestion(skillId, level, career); }
  if (!base) return null;
  const q = _asQuestion(base, { id: `skill:${skillId}:${level}:${src}`, skillId, source: src, level });
  const nxt = nextLevel && INTERVIEW_SKILLS[skillId] && INTERVIEW_SKILLS[skillId][nextLevel];
  if (nxt) q.deeper = _asQuestion({ ...nxt, expectWords: 45 }, { id: `skill:${skillId}:${nextLevel}:curated`, skillId, source: "curated", level: nextLevel });
  return q;
}

function _fundamentalQuestions(level, seed) {
  return _shuf(Object.keys(INTERVIEW_FUNDAMENTALS), seed + "fund").map(k => {
    const it = INTERVIEW_FUNDAMENTALS[k][level][0];
    return _asQuestion({ ...it, expectWords: 45 }, { id: `fund:${k}:${level}`, source: "curated", level, fundamental: k });
  });
}
function _kindRank(k) { return { lang: 0, fw: 1, db: 2, cloud: 3, tool: 4, cs: 5 }[k] ?? 6; }

// ---- plans per category ----
function _technicalPlan(cfg, ctx, seed) {
  const career = ctx.career; const lvl = cfg.level;
  const skills = career.skills.slice().sort((a, b) => b.weight - a.weight);
  const byKind = {}; skills.forEach(s => { const k = (SKILL_LIB[s.id] || {}).kind || "cs"; (byKind[k] = byKind[k] || []).push(s); });
  const order = Object.keys(byKind).sort((a, b) => _kindRank(a) - _kindRank(b));
  const sq = []; let more = true; let round = 0;
  while (more) { more = false; order.forEach(k => { const s = byKind[k][round]; if (s) { more = true; const q = skillInterviewQuestion(s.id, lvl, career, seed); if (q) sq.push(q); } }); round++; if (round > 12) break; }
  if (cfg.language) { const ls = SKILL_LIB[cfg.language] && career.skills.find(s => s.id === cfg.language); if (ls) { const i = sq.findIndex(q => q.skillId === cfg.language); if (i > 0) sq.unshift(sq.splice(i, 1)[0]); } }
  const fq = _fundamentalQuestions(lvl, seed);
  const out = []; let i = 0, j = 0;
  while (out.length < cfg.questions && (i < sq.length || j < fq.length)) {
    if (j < fq.length && (out.length % 2 === 1 || i >= sq.length)) out.push(fq[j++]); else if (i < sq.length) out.push(sq[i++]);
  }
  return out;
}
function _rolePlan(cfg, ctx, seed) {
  const career = ctx.career; const lvl = cfg.level;
  const skills = career.skills.slice().sort((a, b) => b.weight - a.weight);
  const out = skills.map(s => skillInterviewQuestion(s.id, lvl, career, seed)).filter(Boolean);
  const resp = _shuf(career.responsibilities || [], seed + "resp").slice(0, 2).map((r, i) => _asQuestion({
    topic: career.name + " responsibilities",
    q: `In a ${career.name} role you are expected to: "${r}". How would you approach this in practice, and what would you check to know it is done well?`,
    concepts: [..._termConcepts(r, 3, `Tie your answer to: ${r}`), ...GENERIC_CONCEPTS.example, cpt("steps / approach", "first|then|step|approach|plan|process|finally", "Walk through an approach.")],
    expectWords: 60, ideal: r,
  }, { id: `role:${career.id}:resp:${i}`, source: "catalogue", level: lvl }));
  const merged = []; let a = 0, b = 0;
  while (merged.length < cfg.questions && (a < out.length || b < resp.length)) { if (b < resp.length && merged.length % 3 === 2) merged.push(resp[b++]); else if (a < out.length) merged.push(out[a++]); else merged.push(resp[b++]); }
  return merged;
}
function interviewEvidence(ctx) {
  const items = [];
  const gh = ctx.githubData;
  if (gh && gh.projects) gh.projects.forEach(p => items.push({ name: p.name, source: "github", skills: p.evidence || [], lead: `From your GitHub analysis: **${p.name}**${(p.evidence || []).length ? ` (evidence: ${p.evidence.slice(0, 3).join(", ")})` : ""}.` }));
  const text = (ctx.profile && ctx.profile.resumeText) || "";
  const lines = text.split(/\n|(?<=\.)\s+/).map(l => l.trim()).filter(l => l.length > 25 && l.length < 220 && /(project|built|developed|implemented|designed|created|deployed|application|system|platform)/i.test(l));
  const seen = new Set();
  [...lines, ...((ctx.resumeData && ctx.resumeData.achievementLines) || [])].forEach(l => { const k = l.toLowerCase(); if (seen.has(k) || seen.size >= 4) return; seen.add(k); items.push({ name: "the project described on your resume", source: "resume", skills: [], line: l, lead: `From your resume: “${l}”` }); });
  return items;
}
function _projectPlan(cfg, ctx, seed) {
  const ev = interviewEvidence(ctx); const lvl = cfg.level;
  const topics = [...PROJECT_TOPICS[lvl], ...PROJECT_TOPICS.basic.filter(() => lvl !== "basic"), ...PROJECT_TOPICS.intermediate.filter(() => lvl === "advanced")];
  const out = [];
  if (!ev.length) {
    out.push(_asQuestion({ topic: "Project selection", q: "I couldn't find project evidence in your GitHub analysis or resume yet. Pick one project you have actually built (or contributed to) and describe what it does, who it is for, and your part in it.", concepts: PROJECT_TOPICS.basic[0].concepts, expectWords: 55 }, { id: "proj:pick", source: "none", level: lvl, noEvidence: true }));
    for (let i = 0; i < topics.length && out.length < cfg.questions; i++) { const t = topics[i]; if (t.topic === "Project objective") continue; out.push(_asQuestion({ topic: t.topic, q: t.ask.replace(/\{P\}/g, "the project you just described"), concepts: t.concepts, expectWords: 55 }, { id: `proj:none:${lvl}:${i}`, source: "none", level: lvl })); }
    return out;
  }
  for (let i = 0; i < topics.length && out.length < cfg.questions; i++) {
    const t = topics[i]; const e = ev[i % ev.length];
    const P = e.source === "github" ? e.name : "that project";
    out.push(_asQuestion({ topic: `${t.topic} · ${e.source === "github" ? e.name : "resume project"}`, q: `${e.lead.replace(/\*\*/g, "")}\n\n${t.ask.replace(/\{P\}/g, P)}`, concepts: t.concepts, expectWords: 55 },
      { id: `proj:${e.source}:${hashString(e.name + (e.line || ""))}:${t.topic}`, source: e.source, level: lvl, evidence: e.name }));
  }
  return out;
}
function _hrPlan(cfg, ctx, seed) {
  const lvl = cfg.level; const idx = INTERVIEW_LEVEL_IDS.indexOf(lvl);
  const pool = [...INTERVIEW_HR[lvl].map((q, i) => ({ q, id: `hr:${lvl}:${i}` }))];
  [idx - 1, idx + 1].filter(i => i >= 0 && i < 3).forEach(i => INTERVIEW_HR[INTERVIEW_LEVEL_IDS[i]].forEach((q, k) => pool.push({ q, id: `hr:${INTERVIEW_LEVEL_IDS[i]}:${k}` })));
  const first = pool.slice(0, INTERVIEW_HR[lvl].length), rest = pool.slice(INTERVIEW_HR[lvl].length);
  return [..._shuf(first, seed + "hr"), ..._shuf(rest, seed + "hr2")].slice(0, cfg.questions)
    .map(p => _asQuestion({ ...p.q, expectWords: 60 }, { id: p.id, type: "behavioral", source: "curated", level: lvl }));
}
function _designPlan(cfg, ctx, seed) {
  const career = ctx.career; const lvl = cfg.level;
  const sc = DESIGN_SCENARIOS.find(s => s.domains.includes(career.category)) || DESIGN_SCENARIOS[0];
  const stages = DESIGN_STAGES[lvl]; const out = [];
  for (let i = 0; i < cfg.questions; i++) {
    const st = stages[i % stages.length];
    const lead = i === 0 ? sc.scenario + " " : `Continuing with ${sc.title}: `;
    out.push(_asQuestion({ topic: "Design · " + st.topic, q: lead + st.ask, concepts: st.concepts, expectWords: 80 }, { id: `design:${sc.id}:${lvl}:${i}`, type: "design", source: "curated", level: lvl, scenario: sc.id }));
  }
  return out;
}
function _codingPlan(cfg, ctx, seed) {
  const lvl = cfg.level; const lang = cfg.language;
  const probs = _shuf(CODING_PROBLEMS.filter(p => p.level === lvl), seed + "prob");
  const nProb = Math.max(1, Math.min(probs.length, Math.ceil(cfg.questions * 0.67)));
  const out = probs.slice(0, nProb).map(p => _asQuestion({ topic: "Coding · " + p.title, q: p.prompt, concepts: [], expectWords: 30 }, { id: `code:${p.id}`, type: "coding", source: "curated", level: lvl, coding: { id: p.id, fn: p.fn, params: p.params, title: p.title }, ideal: `Expected complexity ${p.expect.split("|")[0]}.` }));
  const reason = [];
  [lang, "dsa", "python", "javascript", "java"].forEach(sk => { const q = _qbankQuestionTyped(sk, lvl, seed); if (q && !reason.some(r => r.skillId === q.skillId)) reason.push(q); });
  const dsa = _qbankQuestion("dsa", lvl, seed + "c"); if (dsa) reason.push(_asQuestion(dsa, { id: `code:dsa:${lvl}`, skillId: "dsa", source: "bank", level: lvl }));
  while (out.length < cfg.questions && reason.length) out.push(reason.shift());
  return out;
}
function _qbankQuestionTyped(skillId, level, seed) {   // output-prediction / debugging items only
  const bank = (typeof QBANK !== "undefined" && QBANK[skillId] && QBANK[skillId][level]) || [];
  if (!bank.some(x => x.type === "output" || x.type === "debug")) return null;
  const list = bank.filter(x => x.type === "output" || x.type === "debug"); const it = _pickOne(list, seed + skillId + "typed");
  const idx = Array.isArray(it.answer) ? it.answer : [it.answer]; const correct = idx.map(i => it.options[i]).join(" ; ");
  const concepts = it.type === "output" ? [cpt("correct output", _esc(correct).replace(/\s+/g, "\\s*"), it.explain, 2), ..._termConcepts(it.explain, 3, it.explain)] : [..._termConcepts(correct, 2, it.explain), ..._termConcepts(it.explain, 3, it.explain)];
  return _asQuestion({ topic: `${(SKILL_LIB[skillId] || {}).name || skillId} · ${it.type === "output" ? "Output prediction" : "Debugging"}`, q: it.type === "output" ? `${it.q} Explain your reasoning.` : `${it.q}\n\nOptions: ${it.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join("   ")}\n\nWhat is wrong, and how would you fix it?`, code: it.code, concepts, expectWords: 30, ideal: `${correct}. ${it.explain}` },
    { id: `code:${skillId}:${level}:${it.type}`, type: "code-reason", skillId, source: "bank", level });
}

function buildInterviewPlan(config, ctx, opts = {}) {
  const cfg = normalizeInterviewConfig(config); const seed = String(opts.seed || Date.now() + ":" + Math.random());
  const build = { technical: _technicalPlan, role: _rolePlan, project: _projectPlan, hr: _hrPlan, design: _designPlan, coding: _codingPlan }[cfg.category];
  let plan = build(cfg, ctx, seed);
  const recent = new Set(opts.exclude || []);
  plan = [...plan.filter(q => !recent.has(q.id)), ...plan.filter(q => recent.has(q.id))];   // prefer questions not asked recently
  return plan.slice(0, Math.max(cfg.questions, 1));
}

// ---------------------------------------------------------------- evaluation
function _count(re, text) { return (text.match(re) || []).length; }
function _clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }
function evaluateAnswer(question, rawText) {
  const text = String(rawText || "").trim(); const words = text.split(/\s+/).filter(Boolean); const n = words.length;
  if (!n) return _skipped(question);
  const concepts = question.concepts || [];
  const matched = [], missed = []; let wSum = 0, wGot = 0;
  concepts.forEach(c => { wSum += c.weight || 1; if ((c.kw || []).some(k => _test(k, text))) { matched.push(c); wGot += c.weight || 1; } else missed.push(c); });
  const coverage = wSum ? wGot / wSum : 0.5;
  const uniq = new Set(words.map(w => w.toLowerCase())).size / n;
  const qWords = new Set(String(question.q || "").toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const echo = words.filter(w => qWords.has(w.toLowerCase().replace(/\W/g, ""))).length / n;
  const lf = Math.min(1, n / (question.expectWords || 40));
  let accuracy = coverage * 100;
  if (n < 4) accuracy = Math.min(accuracy, 15);
  if (n > 8 && uniq < 0.4) accuracy *= 0.5;
  if (echo > 0.8 && coverage < 0.3) accuracy *= 0.5;
  const reasonMarks = _count(/\b(because|therefore|so that|which means|as a result|since|due to|in order to|this (means|allows|ensures)|however|trade.?off|whereas|while|if\b.{0,40}\bthen|otherwise|hence|thus)\b/gi, text);
  const reasoning = n >= 8 ? _clamp(30 + reasonMarks * 22) : 15;
  const exMarks = _count(/\b(for example|e\.g\.|for instance|such as|in practice|in production|i (used|built|worked|deployed|configured|implemented|tested)|my (project|team|experience)|real|command|tool|metric)\b|`[^`]+`|\d+%/gi, text);
  const practical = n >= 8 ? _clamp(0.5 * accuracy + 0.5 * Math.min(100, 20 + exMarks * 25)) : _clamp(accuracy * 0.5);
  const stepMarks = _count(/\b(first|second|third|then|next|finally|step|approach|start by|begin with|after that|consider|edge case|alternatively|otherwise|check|verify)\b/gi, text);
  const problemSolving = n >= 8 ? _clamp(0.55 * accuracy + 0.45 * Math.min(100, 20 + stepMarks * 18)) : _clamp(accuracy * 0.5);
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean); const avgLen = n / Math.max(1, sentences.length);
  const connectors = _count(/\b(first|also|because|however|for example|finally|therefore|additionally|moreover|in summary|overall|so)\b/gi, text);
  let communication = n < 4 ? 15 : 35 + (sentences.length >= 2 ? 20 : 0) + (avgLen >= 6 && avgLen <= 28 ? 15 : 0) + Math.min(15, connectors * 5) + 15 * lf;
  if (avgLen > 45) communication -= 15; if (n > 8 && uniq < 0.4) communication -= 20;
  communication = _clamp(communication);
  const understanding = _clamp(0.65 * accuracy + 0.35 * reasoning);
  const completeness = _clamp(0.7 * coverage * 100 + 0.3 * lf * 100);
  accuracy = _clamp(accuracy);
  const overall = _clamp(0.26 * accuracy + 0.14 * understanding + 0.14 * completeness + 0.12 * reasoning + 0.12 * problemSolving + 0.12 * practical + 0.10 * communication);
  const feedback = [];
  if (matched.length) feedback.push(`Covered: ${matched.map(c => c.name).join(", ")}.`);
  missed.slice(0, 3).forEach(c => feedback.push(`Missing — ${c.name}${c.hint ? ": " + c.hint : ""}`));
  if (n < 4) feedback.push("Your answer was very short — explain the idea in a few sentences.");
  else if (lf < 0.5) feedback.push(`Add more detail (aim for roughly ${question.expectWords || 40}+ words).`);
  if (n >= 4 && reasoning < 45) feedback.push("Explain *why* — use reasoning words like “because” or “so that”.");
  if (n >= 4 && practical < 40) feedback.push("Add a concrete example or a real situation where you used this.");
  if (!missed.length && overall >= 70) feedback.push("Strong, well-structured answer.");
  return { skipped: false, words: n, scores: { accuracy, understanding, completeness, reasoning, problemSolving, practical, communication }, overall, coverage: Math.round(coverage * 100),
    matched: matched.map(c => c.name), missed: missed.map(c => ({ name: c.name, hint: c.hint || "" })), feedback };
}
function _skipped(q) {
  const z = { accuracy: 0, understanding: 0, completeness: 0, reasoning: 0, problemSolving: 0, practical: 0, communication: 0 };
  return { skipped: true, words: 0, scores: z, overall: 0, coverage: 0, matched: [], missed: (q.concepts || []).map(c => ({ name: c.name, hint: c.hint || "" })), feedback: ["Not answered."] };
}

// ---- coding evaluation ----
function evaluateCoding(question, submission, run) {
  const p = CODING_PROBLEMS.find(x => x.id === question.coding.id);
  const code = String(submission.code || ""); const expl = String(submission.explanation || "");
  const lines = code.split("\n").filter(l => l.trim()); const lang = CODE_LANGUAGES.find(l => l.id === submission.language) || CODE_LANGUAGES[0];
  const untouched = !code.trim() || /TODO|write your (code|solution) here/i.test(code) && lines.length < 5;
  if (untouched && !expl.trim()) return { ..._skipped(question), coding: { language: lang.id, executed: false } };
  let correctness, executed = !!(run && run.ran), tests = null;
  if (executed) { correctness = run.total ? Math.round(run.passed / run.total * 100) : 0; tests = { passed: run.passed, total: run.total, error: run.error || null, failures: (run.failures || []).slice(0, 3) }; }
  else {
    const hasFn = new RegExp("\\b" + p.fn + "\\b", "i").test(code) || (lang.id === "python" && /\bdef\b/.test(code)) || /\b(func|function|public|static)\b/.test(code);
    const staticScore = (hasFn ? 25 : 0) + (/\breturn\b/.test(code) ? 15 : 0) + (/\b(for|while|forEach|map|reduce|range|recurs)/.test(code) ? 15 : 0) + (/\b(map|dict|set|hash|Map|HashMap|unordered_map|stack|deque|heap|Set)\b|\{\s*\}/.test(code) ? 15 : 0) + (lines.length >= 3 ? 10 : 0) + (untouched ? 0 : 20);
    correctness = Math.min(65, staticScore);          // never claim verified correctness for a language we cannot run
  }
  const edgeRe = new RegExp(p.edge, "i"); const edgeHits = (expl + " " + code).match(new RegExp(p.edge, "gi")) || [];
  const edge = _clamp((new Set(edgeHits.map(h => h.toLowerCase())).size) * 40 + (/(\.length\s*(===|==|<|<=)\s*[01]|if\s*\(?\s*!|\bis empty\b|not \w+:|len\(\w+\)\s*(==|<)\s*[01])/.test(code) ? 25 : 0));
  const bigO = (expl.match(/O\([^)]*\)/gi) || []).concat(code.match(/(\/\/|#)\s*O\([^)]*\)/gi) || []);
  const exp = p.expect.split("|"); const timeOk = bigO.some(b => exp.some(e => b.toLowerCase().replace(/\s/g, "").includes(e.toLowerCase().replace(/\s/g, "").replace(/\)$/, ""))));
  const timeScore = bigO.length ? (timeOk ? 100 : 50) : (/\b(linear|quadratic|logarithmic|constant|nlogn)\b/i.test(expl) ? 50 : 0);
  const spaceScore = /space/i.test(expl) && /O\(|constant|linear|in.?place/i.test(expl) ? 100 : (/space/i.test(expl) ? 50 : 0);
  const ids = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || [];
  const quality = _clamp(20 + (/(\/\/|#|\/\*)/.test(code) ? 15 : 0) + (ids.length && ids.filter(i => i.length >= 3).length / ids.length > 0.6 ? 25 : 0) + (lines.length >= 3 && lines.length <= 40 ? 20 : 5) + (!/console\.log|print\(/.test(code) ? 20 : 0));
  const comm = expl.trim() ? evaluateAnswer({ q: "", concepts: [], expectWords: 25 }, expl).scores.communication : 35;
  const overall = _clamp(0.5 * correctness + 0.15 * edge + 0.15 * timeScore + 0.05 * spaceScore + 0.15 * quality);
  const feedback = [];
  if (executed) feedback.push(run.error ? `Your code did not run: ${run.error}` : `${run.passed}/${run.total} hidden tests passed.`);
  else feedback.push(`${lang.label} code is not executed in this app — correctness is an estimate from static checks (capped at 65). Choose JavaScript for real test execution.`);
  if (tests && tests.failures.length) tests.failures.forEach(f => feedback.push(`Failed: ${p.fn}(${f.args.map(a => JSON.stringify(a)).join(", ")}) expected ${JSON.stringify(f.expected)}, got ${f.got === undefined ? "an error" : JSON.stringify(f.got)}.`));
  if (edge < 40) feedback.push(`Consider edge cases (${p.edge.split("|").slice(0, 3).join(", ")}).`);
  if (!bigO.length) feedback.push("State the time complexity in your explanation (e.g. O(n)).");
  else if (!timeOk) feedback.push(`Your stated complexity differs from the expected ${exp[0]} — re-check it.`);
  if (!/space/i.test(expl)) feedback.push("Also mention space complexity.");
  if (overall >= 80) feedback.push("Strong solution.");
  return { skipped: false, words: expl.split(/\s+/).filter(Boolean).length, scores: { accuracy: _clamp(correctness), understanding: _clamp((timeScore + spaceScore) / 2), completeness: edge, reasoning: timeScore, problemSolving: _clamp((correctness + edge + timeScore) / 3), practical: quality, communication: comm }, overall, coverage: _clamp(correctness),
    matched: [correctness >= 100 ? "all tests pass" : null, timeOk ? "correct time complexity" : null, edge >= 40 ? "edge cases" : null].filter(Boolean), missed: [correctness < 100 ? { name: "full correctness", hint: "Make every hidden test pass." } : null, !timeOk ? { name: "time complexity", hint: `Expected ${exp[0]}.` } : null, edge < 40 ? { name: "edge cases", hint: p.edge.split("|").slice(0, 3).join(", ") } : null].filter(Boolean),
    feedback, coding: { language: lang.id, executed, tests, correctness, edge, timeScore, spaceScore, quality } };
}
// Browser-only: run JavaScript against the hidden tests in a Worker (3 s timeout). Falls back to in-page execution.
function runJsTests(code, problemId, timeoutMs = 3000) {
  const p = CODING_PROBLEMS.find(x => x.id === problemId);
  const expected = p.tests.map(a => p.ref(...JSON.parse(JSON.stringify(a))));
  const finish = (out, error) => {
    if (error) return { ran: true, passed: 0, total: p.tests.length, error, failures: [] };
    let passed = 0; const failures = [];
    out.forEach((o, i) => { const ok = o.ok && JSON.stringify(o.v) === JSON.stringify(expected[i]); if (ok) passed++; else failures.push({ args: p.tests[i], expected: expected[i], got: o.ok ? o.v : undefined }); });
    return { ran: true, passed, total: p.tests.length, error: null, failures };
  };
  const body = `var d=e.data;try{var f=new Function(d.code+"\\nreturn typeof "+d.fn+"==='function'?"+d.fn+":undefined;")();if(!f){return {error:"Function "+d.fn+" is not defined."}}var out=[];for(var i=0;i<d.tests.length;i++){try{out.push({ok:true,v:f.apply(null,JSON.parse(JSON.stringify(d.tests[i])))})}catch(err){out.push({ok:false,e:String(err)})}}return {out:out}}catch(err){return {error:String(err)}}`;
  const payload = { code, fn: p.fn, tests: p.tests };
  return new Promise(resolve => {
    try {
      if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) throw new Error("no worker");
      const url = URL.createObjectURL(new Blob([`self.onmessage=function(e){self.postMessage((function(e){${body}})(e))}`], { type: "text/javascript" }));
      const w = new Worker(url); const timer = setTimeout(() => { w.terminate(); resolve(finish(null, "Timed out after 3 seconds (possible infinite loop).")); }, timeoutMs);
      w.onmessage = (ev) => { clearTimeout(timer); w.terminate(); resolve(finish(ev.data.out, ev.data.error)); };
      w.onerror = (ev) => { clearTimeout(timer); w.terminate(); resolve(finish(null, ev.message || "Runtime error")); };
      w.postMessage(payload);
    } catch (e) {
      try { const r = new Function("e", body)({ data: payload }); resolve(finish(r.out, r.error)); } catch (err) { resolve(finish(null, String(err))); }
    }
  });
}
function codingStarter(problemId, langId) {
  const p = CODING_PROBLEMS.find(x => x.id === problemId); const ps = p.params;
  const snake = p.fn.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
  return ({
    javascript: `function ${p.fn}(${ps}) {\n  // TODO: write your solution here\n}\n`,
    typescript: `function ${p.fn}(${ps.split(",").map(x => x.trim() + ": any").join(", ")}): any {\n  // TODO: write your solution here\n}\n`,
    python: `def ${snake}(${ps}):\n    # TODO: write your solution here\n    pass\n`,
    java: `class Solution {\n    public static Object ${p.fn}(${ps.split(",").map(x => "Object " + x.trim()).join(", ")}) {\n        // TODO: write your solution here\n        return null;\n    }\n}\n`,
    cpp: `auto ${p.fn}(${ps.split(",").map(x => "auto " + x.trim()).join(", ")}) {\n    // TODO: write your solution here\n}\n`,
    go: `func ${p.fn}(${ps.split(",").map(x => x.trim() + " interface{}").join(", ")}) interface{} {\n    // TODO: write your solution here\n    return nil\n}\n`,
    csharp: `static object ${p.fn[0].toUpperCase() + p.fn.slice(1)}(${ps.split(",").map(x => "object " + x.trim()).join(", ")}) {\n    // TODO: write your solution here\n    return null;\n}\n`,
  })[langId] || "";
}

// ---------------------------------------------------------------- the adaptive interview
function _lead(ev, seed) {
  if (ev.skipped) return "No problem — let's move on.";
  const m = ev.matched.slice(0, 2).join(" and ");
  if (ev.overall >= 70) return _pickOne([`Good — you covered ${m || "the key points"}.`, `Nice answer — ${m || "the main ideas"} came through clearly.`, `That's solid — ${m || "the essentials"} are there.`], seed);
  if (ev.overall >= 40) return ev.matched.length ? `Okay — you mentioned ${ev.matched[0]}, but I'd like to hear more.` : "Okay, that's a start, but it needs more substance.";
  return "That answer was quite thin — let me probe a little.";
}
function _followUp(q, ev, level, careerName, seed) {
  if (!q || q.kind !== "primary" || ev.skipped || q.type === "coding") return null;
  const strong = ev.coverage >= 70 && ev.overall >= 60;
  if (ev.coverage < 45 && ev.missed.length && (q.concepts || []).length) {
    const m = q.concepts.find(c => c.name === ev.missed[0].name) || q.concepts[0];
    return { question: { ...q, id: q.id + ":clarify", kind: "followup", type: q.type === "behavioral" ? "behavioral" : "concept", concepts: [m, ...GENERIC_CONCEPTS.example], expectWords: 35,
      q: `Let's focus on one point your answer left out: “${m.name}”. Can you explain that part?` }, lead: "Let me dig into one gap." };
  }
  if (strong) {
    if (q.deeper) return { question: { ...q.deeper, kind: "followup" }, lead: "Good. Let's go a step further." };
    const topic = String(q.topic || "this").split("·")[0].trim();
    if (q.type === "behavioral") return { question: { ...q, id: q.id + ":deeper", kind: "followup", q: "What would you do differently next time, and what did you learn from it?", concepts: [cpt("what you'd change", "different|change|improve|better|next time|instead", "Say what you'd change."), cpt("lesson learned", "learn|lesson|realis|understand|now i", "State the lesson.")], expectWords: 35 }, lead: "Thanks — one more angle." };
    const gen = { basic: ["Can you give a concrete example of where " + topic + " matters in a " + careerName + " role?", GENERIC_CONCEPTS.example], intermediate: ["What are the common mistakes or trade-offs with " + topic + ", and how would you avoid them?", GENERIC_CONCEPTS.tradeoff], advanced: ["Suppose " + topic + " failed in production. How would you detect it, diagnose it and prevent it happening again?", GENERIC_CONCEPTS.troubleshoot] }[level];
    if (q.type !== "design") return { question: { ...q, id: q.id + ":deeper", kind: "followup", q: gen[0], concepts: gen[1], expectWords: 45, deeper: null }, lead: "Good. Let's go a step further." };
  }
  return null;
}
function startInterview(config, ctx, opts = {}) {
  const cfg = normalizeInterviewConfig(config); const career = ctx.career;
  const plan = buildInterviewPlan(cfg, ctx, opts);
  const cat = INTERVIEW_CATEGORY_BY_ID[cfg.category];
  const noEv = cfg.category === "project" && plan[0] && plan[0].noEvidence;
  const intro = `Hi, I'm Aria, your AI interviewer. Today is a ${INTERVIEW_LEVEL_LABEL[cfg.level]} ${cat.label.toLowerCase()} interview for a ${career.name} role — ${cfg.questions} questions, about ${cfg.minutes} minutes. I'll ask one question at a time and may follow up on your answers. Take your time and answer as you would in a real interview.`;
  return { config: cfg, careerName: career.name, plan, pointer: 1, current: plan[0], turns: [], total: Math.min(cfg.questions, Math.max(plan.length, 1)), startedAt: Date.now(), limitSec: cfg.minutes * 60,
    messages: [{ from: "ai", text: intro }, ...(noEv ? [{ from: "ai", text: "Note: I couldn't find GitHub or resume project evidence, so I won't assume any project details. Add them in GitHub Analyzer / Resume Intelligence for tailored questions." }] : [])], seed: String(opts.seed || ""), done: false };
}
// answer: text (or {code, explanation, language, run} for coding questions); returns a NEW session.
function submitTurn(session, answer, opts = {}) {
  const q = session.current; if (!q || session.done) return session;
  let ev, shown;
  if (q.type === "coding") {
    const sub = typeof answer === "object" && answer ? answer : { code: String(answer || ""), explanation: "" };
    ev = evaluateCoding(q, { ...sub, language: sub.language || session.config.language }, sub.run || null);
    shown = sub.code || "";
  } else { shown = String(answer || ""); ev = opts.skip ? _skipped(q) : evaluateAnswer(q, shown); }
  const turn = { n: session.turns.length + 1, id: q.id, kind: q.kind, type: q.type, topic: q.topic, skillId: q.skillId || null, level: q.level || session.config.level, q: q.q, code: q.code || null,
    answer: shown, explanation: q.type === "coding" && typeof answer === "object" ? answer.explanation || "" : "", ev, ideal: q.ideal || "" };
  const turns = [...session.turns, turn];
  const messages = [...session.messages, { from: "ai", text: q.q, q: true, n: turn.n }, { from: "you", text: shown || "(skipped)", n: turn.n }];
  const base = { ...session, turns, messages };
  const left = session.total - turns.length;
  if (left <= 0 || opts.finish) return { ...base, current: null, done: true };
  const lead = _lead(ev, q.id + turns.length);
  const fu = left >= 1 ? _followUp(q, ev, q.level || session.config.level, session.careerName, q.id) : null;
  if (fu) return { ...base, current: fu.question, messages: [...messages, { from: "ai", text: `${lead} ${fu.lead}`, lead: true }] };
  const next = session.plan[session.pointer];
  if (!next) return { ...base, current: null, done: true };
  return { ...base, current: next, pointer: session.pointer + 1, messages: [...messages, { from: "ai", text: lead + (opts.skip ? "" : " Next question."), lead: true }] };
}

// ---------------------------------------------------------------- report + history + integration
function buildInterviewReport(session, extra = {}) {
  const t = session.turns.filter(x => !x.ev.skipped); const all = session.turns;
  const avg = (f) => (t.length ? Math.round(t.reduce((s, x) => s + f(x.ev.scores), 0) / t.length) : 0);
  const asked = Math.max(1, all.length);
  const sumOverall = all.reduce((s, x) => s + x.ev.overall, 0);            // unanswered/skipped count as zero
  const overall = Math.round(sumOverall / asked);
  const scale = all.length ? t.length / all.length : 0;
  const technical = Math.round(avg(s => 0.5 * s.accuracy + 0.25 * s.understanding + 0.25 * s.completeness) * scale);
  const problemSolving = Math.round(avg(s => 0.6 * s.problemSolving + 0.4 * s.reasoning) * scale);
  const communication = avg(s => s.communication);
  const practical = Math.round(avg(s => s.practical) * scale);
  const topics = {}; all.forEach(x => { const k = String(x.topic).split("·")[0].trim(); (topics[k] = topics[k] || []).push(x.ev.overall); });
  const topicList = Object.keys(topics).map(k => ({ topic: k, pct: Math.round(topics[k].reduce((a, b) => a + b, 0) / topics[k].length), n: topics[k].length })).sort((a, b) => a.pct - b.pct);
  const missedMap = {}; all.forEach(x => (x.ev.missed || []).forEach(m => { if (!missedMap[m.name]) missedMap[m.name] = { concept: m.name, hint: m.hint, topic: String(x.topic).split("·")[0].trim(), skillId: x.skillId }; }));
  const missed = Object.values(missedMap).slice(0, 14);
  const learning = []; const seenT = {};
  all.filter(x => !x.ev.skipped ? x.ev.overall < 60 : true).forEach(x => {
    const k = String(x.topic).split("·")[0].trim(); if (seenT[k]) return; seenT[k] = 1;
    const sk = x.skillId && SKILL_LIB[x.skillId];
    learning.push({ topic: k, why: (x.ev.missed || []).slice(0, 2).map(m => m.name).join(", ") || "Needs more depth", resources: sk && typeof skillResources === "function" ? skillResources(x.skillId, sk.name) : [`Review ${k} fundamentals and practise explaining it out loud`, `Do two more ${INTERVIEW_LEVEL_LABEL[session.config.level].toLowerCase()}-level practice questions on ${k}`] });
  });
  return {
    overall, scores: { technical, problemSolving, communication, practical }, answered: t.length, total: all.length, skipped: all.length - t.length,
    topics: topicList, strong: topicList.filter(x => x.pct >= 70).map(x => x.topic), weak: topicList.filter(x => x.pct < 50).map(x => x.topic),
    missed, learning: learning.slice(0, 6), timeSec: Math.round(extra.timeSec || (Date.now() - session.startedAt) / 1000), limitSec: session.limitSec, timedOut: !!extra.timedOut,
  };
}
function interviewHistoryEntry(session, report, meta) {
  const trunc = (s, n) => String(s || "").slice(0, n);
  return {
    id: meta.id || "iv-" + Date.now(), at: meta.at || new Date().toISOString(), careerId: session.config.careerId || "", careerName: session.careerName,
    category: session.config.category, level: session.config.level, language: session.config.language, mode: session.config.mode,
    overall: report.overall, scores: report.scores, answered: report.answered, total: report.total, timeSec: report.timeSec, limitSec: report.limitSec,
    topics: report.topics.map(x => [x.topic, x.pct, x.n]), strong: report.strong, weak: report.weak, missed: report.missed.map(m => ({ concept: m.concept, topic: m.topic })),
    learning: report.learning.map(l => ({ topic: l.topic, why: l.why })),
    questions: session.turns.map(x => ({ n: x.n, qid: x.id, kind: x.kind, type: x.type, topic: trunc(x.topic, 100), skillId: x.skillId, level: x.level, q: trunc(x.q, 600), code: x.code ? trunc(x.code, 800) : undefined,
      a: trunc(x.answer, 4000), expl: x.explanation ? trunc(x.explanation, 1000) : undefined, score: x.ev.overall, skipped: !!x.ev.skipped, matched: x.ev.matched.slice(0, 8), missed: x.ev.missed.slice(0, 6).map(m => m.name), feedback: x.ev.feedback.slice(0, 6).map(f => trunc(f, 300)),
      coding: x.ev.coding ? { language: x.ev.coding.language, executed: x.ev.coding.executed, passed: x.ev.coding.tests ? x.ev.coding.tests.passed : undefined, total: x.ev.coding.tests ? x.ev.coding.tests.total : undefined } : undefined })),
  };
}
// Legacy-shaped summary consumed by the readiness engine: average of the last 5 interviews, scaled by level
// (a Basic round counts for less than an Advanced one). Interviews are never the only evidence — weight is 10%.
function interviewAggregate(history) {
  const h = (history || []).slice(-5); if (!h.length) return null;
  const f = (e) => INTERVIEW_LEVEL_FACTOR[e.level] || 0.9;
  const m = (k) => Math.round(h.reduce((s, e) => s + (e.scores[k] || 0) * f(e), 0) / h.length);
  return { mode: h[h.length - 1].category, scores: { technical: m("technical"), communication: m("communication"), problemSolving: m("problemSolving") }, count: h.length };
}
// Per-skill interview evidence on the 0–10 scale used by the Digital Twin (null = no interview evidence for the skill).
function interviewSkillEvidence(history, skillId) {
  const vals = [];
  (history || []).forEach(e => (e.questions || []).forEach(q => { if (q.skillId === skillId && !q.skipped) vals.push(q.score * (INTERVIEW_LEVEL_FACTOR[q.level] || 0.9)); }));
  if (!vals.length) return null;
  const last = vals.slice(-6); return Math.max(0, Math.min(10, Math.round(last.reduce((a, b) => a + b, 0) / last.length / 10)));
}
function interviewRepeatedWeaknesses(history) {
  const c = {}; (history || []).forEach(e => { const seen = new Set(); (e.missed || []).forEach(m => { if (seen.has(m.concept)) return; seen.add(m.concept); const o = (c[m.concept] = c[m.concept] || { concept: m.concept, topic: m.topic, count: 0 }); o.count++; }); });
  return Object.values(c).filter(x => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 6);
}
