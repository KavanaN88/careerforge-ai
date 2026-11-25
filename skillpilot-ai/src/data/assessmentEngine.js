// ============================================================================
// ASSESSMENT ENGINE — isomorphic (runs in the browser bundle AND in the Node backend, which loads
// the data files with `new Function`). Pure functions, no DOM, no React.
//   questionPool(skillId, level)           every candidate question (curated + generated)
//   buildAssessment(skillId, level, cfg, o) a seeded, non-repeating question set (WITH answers)
//   publicQuestions(questions)             same set with answers/explanations stripped
//   gradeAssessment(questions, answers, o) score, topic analysis, per-question review
//   skillComposite(entries)                0-100 evidence score for one skill from its history
//   recommendNext(career, history, state)  what to assess next and why
// ============================================================================

const ASSESSMENT_LEVELS = [
  { id: "basic",        label: "Basic",        short: "Fundamentals",  desc: "Fundamentals, terminology, syntax and core concepts.",                              questions: 10, minutes: 15, passPct: 60 },
  { id: "intermediate", label: "Intermediate", short: "Practical",     desc: "Practical implementation, debugging, code analysis and real-world scenarios.",       questions: 15, minutes: 25, passPct: 65 },
  { id: "advanced",     label: "Advanced",     short: "Production",    desc: "Complex scenarios, architecture, performance, security and production troubleshooting.", questions: 20, minutes: 40, passPct: 70 },
];
const ASSESSMENT_LEVEL_IDS = ASSESSMENT_LEVELS.map(l => l.id);
const ASSESSMENT_FORMATS = [
  { id: "mcq", label: "Single choice" }, { id: "multi", label: "Multiple answer" }, { id: "tf", label: "True / False" },
  { id: "output", label: "Code output" }, { id: "debug", label: "Debugging" }, { id: "scenario", label: "Scenario / problem solving" },
];
const ASSESSMENT_FORMAT_IDS = ASSESSMENT_FORMATS.map(f => f.id);
// Weight of each level's best score in the per-skill evidence score. Unattempted levels count as 0,
// so Basic-only results can never be read as verified expert proficiency.
const LEVEL_WEIGHTS = { basic: 0.40, intermediate: 0.35, advanced: 0.25 };

function defaultAssessmentConfig() {
  const levels = {};
  ASSESSMENT_LEVELS.forEach(l => { levels[l.id] = { enabled: true, questions: l.questions, minutes: l.minutes, passPct: l.passPct, formats: ASSESSMENT_FORMAT_IDS.slice() }; });
  return { levels };
}
// Clamp / repair any (possibly hostile or partial) config object into a safe full config.
function normalizeAssessmentConfig(raw) {
  const base = defaultAssessmentConfig();
  const src = raw && typeof raw === "object" && raw.levels && typeof raw.levels === "object" ? raw.levels : {};
  const num = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  ASSESSMENT_LEVEL_IDS.forEach(id => {
    const s = src[id] || {}, d = base.levels[id];
    const formats = Array.isArray(s.formats) ? s.formats.filter(f => ASSESSMENT_FORMAT_IDS.includes(f)) : d.formats;
    base.levels[id] = {
      enabled: s.enabled === false ? false : true,
      questions: num(s.questions, 1, 50, d.questions),
      minutes: num(s.minutes, 1, 180, d.minutes),
      passPct: num(s.passPct, 1, 100, d.passPct),
      formats: formats.length ? formats : d.formats,
    };
  });
  return base;
}

// ---------------------------------------------------------------- generated question pools
const KIND_NOUN = { lang: "a programming language", fw: "a framework or library", db: "a database technology", tool: "a development or operations tool", cloud: "a cloud platform", cs: "a concept or engineering discipline" };

function _pick(pool, n, seedStr) {
  const out = []; const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(seededRandom(hashString(seedStr) + i * 7919) * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  for (let i = 0; i < arr.length && out.length < n; i++) if (!out.includes(arr[i])) out.push(arr[i]);
  return out;
}
function _careersWith(skillId) { return CAREERS.filter(c => c.skills.some(s => s.id === skillId)); }
function _chain(skillId, limit = 3) {           // transitive prerequisite chain, deepest first
  const out = []; let cur = SKILL_LIB[skillId];
  while (cur && cur.deps.length && out.length < limit) { const d = SKILL_LIB[cur.deps[0]]; if (!d || out.includes(d.id) || d.id === skillId) break; out.push(d.id); cur = d; }
  return out.reverse();
}

// Each family returns { type, topic, q, options (correct first, shuffled later), answer (index or [indexes]), explain }
function _generated(skillId, level) {
  const s = SKILL_LIB[skillId]; if (!s) return [];
  const all = Object.values(SKILL_LIB);
  const diffPurpose = all.filter(o => o.id !== skillId && o.purpose !== s.purpose);
  const sameKind = diffPurpose.filter(o => o.kind === s.kind);
  const otherKind = all.filter(o => o.kind !== s.kind);
  const out = []; const add = (key, q) => out.push({ ...q, gkey: key });
  const kindNouns = Object.keys(KIND_NOUN).filter(k => k !== s.kind).map(k => KIND_NOUN[k]);
  const careers = _careersWith(skillId);

  if (level === "basic") {
    add("purpose", { type: "mcq", topic: "Core concepts", q: `What is ${s.name} primarily used for?`, options: [s.purpose, ..._pick(diffPurpose, 3, skillId + "bp").map(o => o.purpose)], answer: 0, explain: `${s.name} is used for ${s.purpose}.` });
    add("kind", { type: "mcq", topic: "Terminology", q: `Which description best fits ${s.name}?`, options: [KIND_NOUN[s.kind], ..._pick(kindNouns, 3, skillId + "bk")], answer: 0, explain: `${s.name} is ${KIND_NOUN[s.kind]}.` });
    add("tf-true", { type: "tf", topic: "Core concepts", q: `${s.name} is commonly used for ${s.purpose}.`, options: ["True", "False"], answer: 0, explain: `Correct — ${s.name} is used for ${s.purpose}.` });
    const wp = _pick(diffPurpose, 1, skillId + "bf")[0];
    if (wp) add("tf-false", { type: "tf", topic: "Core concepts", q: `${s.name} is primarily used for ${wp.purpose}.`, options: ["True", "False"], answer: 1, explain: `False — ${s.name} is used for ${s.purpose}; ${wp.purpose} describes ${wp.name}.` });
    add("which-kind", { type: "mcq", topic: "Terminology", q: `Which of these is ${KIND_NOUN[s.kind]}?`, options: [s.name, ..._pick(otherKind, 3, skillId + "bw").map(o => o.name)], answer: 0, explain: `${s.name} is ${KIND_NOUN[s.kind]}.` });
    if (s.deps.length && SKILL_LIB[s.deps[0]]) {
      const d = SKILL_LIB[s.deps[0]];
      add("prereq", { type: "mcq", topic: "Learning path", q: `Which of these is a common prerequisite to learn before ${s.name}?`, options: [d.name, ..._pick(all.filter(o => o.id !== skillId && !s.deps.includes(o.id) && o.kind !== d.kind), 3, skillId + "bd").map(o => o.name)], answer: 0, explain: `${d.name} is a foundation for ${s.name}.` });
    }
  }

  if (level === "intermediate") {
    add("scenario-purpose", { type: "scenario", topic: "Applying skills", q: `Your team needs a technology for ${s.purpose}. Which is the best fit?`, options: [s.name, ..._pick(sameKind.length >= 3 ? sameKind : diffPurpose, 3, skillId + "is").map(o => o.name)], answer: 0, explain: `${s.name} is the one used for ${s.purpose}.` });
    const peer = _pick(sameKind, 1, skillId + "im")[0];
    if (peer) add("multi-kind", { type: "multi", topic: "Terminology", q: `Select ALL that are ${KIND_NOUN[s.kind]}:`, options: [s.name, peer.name, ..._pick(otherKind, 2, skillId + "imo").map(o => o.name)], answer: [0, 1], explain: `${s.name} and ${peer.name} are both ${KIND_NOUN[s.kind]}.` });
    if (s.deps.length && SKILL_LIB[s.deps[0]]) {
      const d = SKILL_LIB[s.deps[0]];
      add("tf-prereq", { type: "tf", topic: "Learning path", q: `${d.name} is a sensible foundation to build before ${s.name}.`, options: ["True", "False"], answer: 0, explain: `${d.name} underpins ${s.name}.` });
      add("tf-reverse", { type: "tf", topic: "Learning path", q: `You should master ${s.name} before learning ${d.name}.`, options: ["True", "False"], answer: 1, explain: `The usual order is ${d.name} first, then ${s.name}.` });
    }
    _pick(careers, 4, skillId + "ic").forEach(c => {
      const others = CAREERS.filter(o => !o.skills.some(x => x.id === skillId));
      add("career-has-" + c.id, { type: "mcq", topic: "Career relevance", q: `Which role lists ${s.name} among its core skills?`, options: [c.name, ..._pick(others, 3, skillId + c.id + "ico").map(o => o.name)], answer: 0, explain: `${s.name} is a core skill for ${c.name}.` });
      const sibs = c.skills.filter(x => x.id !== skillId && SKILL_LIB[x.id] && SKILL_LIB[x.id].purpose !== s.purpose);
      if (sibs.length >= 3) add("career-need-" + c.id, { type: "scenario", topic: "Applying skills", q: `As a ${c.name}, you must handle ${s.purpose}. Which skill from your role's stack do you reach for?`, options: [s.name, ..._pick(sibs, 3, skillId + c.id + "icn").map(o => o.name)], answer: 0, explain: `${s.name} covers ${s.purpose}.` });
    });
  }

  if (level === "advanced") {
    const chain = _chain(skillId);
    if (chain.length) {
      const names = chain.map(id => SKILL_LIB[id].name); const good = [...names, s.name].join(" → ");
      const rev = [s.name, ...names.slice().reverse()].join(" → ");
      const swap = names.length > 1 ? [names[1], names[0], s.name].join(" → ") : [s.name, names[0]].join(" → ");
      const pad = [_pick(otherKind, 1, skillId + "a1")[0].name, ...names, s.name].join(" → ");
      add("path", { type: "mcq", topic: "Learning path", q: `Which learning sequence best respects the prerequisites of ${s.name}?`, options: [good, rev, swap === rev ? pad : swap, [s.name, ...names].join(" → ")], answer: 0, explain: `Foundations come first: ${good}.` });
    }
    const rival = _pick(sameKind, 2, skillId + "ar");
    rival.forEach((r, i) => add("tradeoff-" + i, { type: "scenario", topic: "Trade-offs", q: `Your project requires ${s.purpose}. A teammate proposes ${r.name}, which is mainly used for ${r.purpose}. What is the strongest decision?`, options: [`Choose ${s.name} — it targets ${s.purpose}`, `Choose ${r.name} — it is the better fit`, `Use both for every task`, `Postpone the decision indefinitely`], answer: 0, explain: `${s.name} is aimed at ${s.purpose}, whereas ${r.name} is aimed at ${r.purpose}.` }));
    _pick(careers, 4, skillId + "ac").forEach(c => {
      const sk = c.skills.find(x => x.id === skillId);
      const deps = (sk.deps || []).filter(d => SKILL_LIB[d]);
      const rest = c.skills.filter(x => x.id !== skillId && !deps.includes(x.id) && !(x.deps || []).includes(skillId));
      if (deps.length && rest.length >= 2) {
        const pick = deps.slice(0, 2);
        add("deps-" + c.id, { type: "multi", topic: "Career architecture", q: `In the ${c.name} skill graph, which skills should be in place BEFORE ${s.name}? Select all that apply.`, options: [...pick.map(d => SKILL_LIB[d].name), ..._pick(rest, 4 - pick.length, skillId + c.id + "ad").map(o => o.name)], answer: pick.map((d, i) => i), explain: `${s.name} builds on ${pick.map(d => SKILL_LIB[d].name).join(" and ")} for a ${c.name}.` });
      }
      const dependants = c.skills.filter(x => (x.deps || []).includes(skillId) && SKILL_LIB[x.id]);
      if (dependants.length && rest.length >= 3) {
        const dd = dependants[0];
        add("unlocks-" + c.id, { type: "mcq", topic: "Career architecture", q: `For a ${c.name}, which skill is unlocked by (builds directly on) ${s.name}?`, options: [dd.name, ..._pick(rest, 3, skillId + c.id + "au").map(o => o.name)], answer: 0, explain: `${dd.name} depends on ${s.name} in the ${c.name} skill graph.` });
      }
      add("integration-" + c.id, { type: "scenario", topic: "Career architecture", q: `A ${c.name} must deliver ${s.purpose} while keeping the stack minimal. Which single skill from the role's core stack most directly provides it?`, options: [s.name, ..._pick(c.skills.filter(x => x.id !== skillId && SKILL_LIB[x.id] && SKILL_LIB[x.id].purpose !== s.purpose), 3, skillId + c.id + "ai").map(o => o.name)], answer: 0, explain: `${s.name} is the skill used for ${s.purpose}.` });
    });
  }
  return out.filter(q => q.options.length >= 2 && new Set(q.options).size === q.options.length);
}

// Full pool = curated (hand-written, source "curated") + generated (source "generated").
function questionPool(skillId, level) {
  const out = [];
  const cur = (typeof QBANK !== "undefined" && QBANK[skillId] && QBANK[skillId][level]) || [];
  cur.forEach((q, i) => out.push({ ...q, id: `${skillId}:${level}:c${i}`, source: "curated" }));
  _generated(skillId, level).forEach(q => out.push({ ...q, id: `${skillId}:${level}:g:${q.gkey}`, source: "generated" }));
  return out;
}
function poolSize(skillId, level) { return questionPool(skillId, level).length; }

// ---------------------------------------------------------------- build / public / grade
function _shuffle(arr, seedStr) {
  const a = arr.slice(); const base = hashString(seedStr);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seededRandom(base + i * 104729) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
// opts: { seed, exclude: [questionIds seen recently] }. Never returns more than the pool holds.
function buildAssessment(skillId, level, config, opts = {}) {
  const cfg = normalizeAssessmentConfig(config).levels[level];
  const seed = String(opts.seed || Date.now() + ":" + Math.random());
  const exclude = new Set(opts.exclude || []);
  let pool = questionPool(skillId, level).filter(q => cfg.formats.includes(q.type));
  const fresh = pool.filter(q => !exclude.has(q.id)), stale = pool.filter(q => exclude.has(q.id));
  const ordered = [..._shuffle(fresh.filter(q => q.source === "curated"), seed + "c"), ..._shuffle(fresh.filter(q => q.source !== "curated"), seed + "g")];
  // interleave so curated technical questions lead but formats stay mixed
  const picked = []; const byType = {};
  ordered.forEach(q => { (byType[q.type] = byType[q.type] || []).push(q); });
  const types = _shuffle(Object.keys(byType), seed + "t");
  while (picked.length < cfg.questions && types.some(t => byType[t].length)) {
    for (const t of types) { if (picked.length >= cfg.questions) break; if (byType[t].length) picked.push(byType[t].shift()); }
  }
  for (const q of _shuffle(stale, seed + "s")) { if (picked.length >= cfg.questions) break; picked.push(q); }
  return _shuffle(picked, seed + "f").map((q, i) => {
    let options = q.options, answer = q.answer;
    if (q.type !== "tf") {
      const order = _shuffle(q.options.map((_, k) => k), seed + q.id);
      options = order.map(k => q.options[k]);
      answer = Array.isArray(q.answer) ? q.answer.map(a => order.indexOf(a)).sort((a, b) => a - b) : order.indexOf(q.answer);
    }
    return { id: q.id, n: i + 1, type: q.type, topic: q.topic, q: q.q, code: q.code || null, options, answer, explain: q.explain, source: q.source };
  });
}
function publicQuestions(questions) {
  return questions.map(q => ({ id: q.id, n: q.n, type: q.type, topic: q.topic, q: q.q, code: q.code || null, options: q.options.slice(), multi: q.type === "multi" }));
}
function _sameSet(a, b) { const x = [...a].sort(), y = [...b].sort(); return x.length === y.length && x.every((v, i) => v === y[i]); }
function isAnswerCorrect(q, given) {
  if (given === undefined || given === null) return false;
  if (Array.isArray(q.answer)) return Array.isArray(given) && _sameSet(q.answer.map(Number), given.map(Number));
  return Number(given) === q.answer;
}
function isAnswered(given) { return Array.isArray(given) ? given.length > 0 : (given !== undefined && given !== null && given !== ""); }

function gradeAssessment(questions, answers, opts = {}) {
  answers = answers || {};
  const passPct = opts.passPct || 60; const elapsed = Math.max(0, Math.round(opts.elapsedSec || 0));
  let correct = 0, unanswered = 0; const topics = {};
  const review = questions.map(q => {
    const given = answers[q.id]; const answered = isAnswered(given); const ok = answered && isAnswerCorrect(q, given);
    if (ok) correct++; if (!answered) unanswered++;
    const t = (topics[q.topic] = topics[q.topic] || { correct: 0, total: 0 }); t.total++; if (ok) t.correct++;
    return { id: q.id, n: q.n, type: q.type, topic: q.topic, q: q.q, code: q.code, options: q.options, answer: q.answer, given: answered ? given : null, answered, correct: ok, explain: q.explain };
  });
  const total = questions.length; const pct = total ? Math.round((correct / total) * 100) : 0;
  const topicList = Object.keys(topics).map(k => ({ topic: k, correct: topics[k].correct, total: topics[k].total, pct: Math.round(topics[k].correct / topics[k].total * 100) })).sort((a, b) => a.pct - b.pct);
  return {
    total, correct, incorrect: total - correct - unanswered, unanswered, pct, passed: pct >= passPct, passPct, timeSec: elapsed,
    topics: topicList,
    weakTopics: topicList.filter(t => t.pct < 60).map(t => t.topic),
    strongTopics: topicList.filter(t => t.pct >= 80).map(t => t.topic),
    review,
  };
}
// Compact record kept in history (no answers for unattempted work; review limited to mistakes).
function historyEntry(meta, result) {
  return {
    id: meta.id, skillId: meta.skillId, skillName: meta.skillName || (SKILL_LIB[meta.skillId] || {}).name || meta.skillId,
    careerId: meta.careerId || "", level: meta.level, at: meta.at || new Date().toISOString(),
    pct: result.pct, correct: result.correct, incorrect: result.incorrect, unanswered: result.unanswered, total: result.total,
    passed: result.passed, passPct: result.passPct, timeSec: result.timeSec, limitSec: meta.limitSec || 0,
    topics: result.topics.map(t => [t.topic, t.correct, t.total]),
    questionIds: result.review.map(r => r.id),
    missed: result.review.filter(r => !r.correct).slice(0, 25).map(r => ({ id: r.id, topic: r.topic, q: r.q })),
  };
}

// ---------------------------------------------------------------- evidence + recommendations
function skillLevelSummary(history, skillId) {
  const out = {}; ASSESSMENT_LEVEL_IDS.forEach(l => { out[l] = { attempts: 0, best: null, last: null, passed: false, lastAt: null }; });
  (history || []).filter(h => h.skillId === skillId && out[h.level]).forEach(h => {
    const o = out[h.level]; o.attempts++; o.best = o.best === null ? h.pct : Math.max(o.best, h.pct);
    if (!o.lastAt || h.at >= o.lastAt) { o.last = h.pct; o.lastAt = h.at; }
    if (h.passed) o.passed = true;
  });
  return out;
}
// 0-100 evidence score for a skill. Unattempted levels count as 0.
function skillComposite(history, skillId) {
  const sum = skillLevelSummary(history, skillId);
  return Math.round(ASSESSMENT_LEVEL_IDS.reduce((t, l) => t + LEVEL_WEIGHTS[l] * (sum[l].best || 0), 0));
}
// 0-10 value stored in the legacy assessmentResults map that the readiness engine consumes.
function compositeToTen(composite) { return Math.max(0, Math.min(10, Math.round(composite / 10))); }

function weakTopicsFor(history, skillId) {
  const acc = {};
  (history || []).filter(h => h.skillId === skillId).forEach(h => (h.topics || []).forEach(([t, c, n]) => { const a = (acc[t] = acc[t] || { c: 0, n: 0, miss: 0 }); a.c += c; a.n += n; if (c < n) a.miss++; }));
  return Object.keys(acc).filter(t => acc[t].n >= 2 && acc[t].c / acc[t].n < 0.6).sort((a, b) => acc[a].c / acc[a].n - acc[b].c / acc[b].n);
}

// Recommend the next assessments (never jumps to Advanced just because the role is advanced).
function recommendNext(career, history, skillState, config) {
  const cfg = normalizeAssessmentConfig(config).levels;
  const recs = [];
  career.skills.forEach(sk => {
    const sum = skillLevelSummary(history, sk.id); const conf = skillState && skillState[sk.id] ? (skillState[sk.id].score || 0) : 0;
    const weak = weakTopicsFor(history, sk.id);
    let level = null, reason = "", urgency = 0;
    if (!sum.basic.attempts) { level = "basic"; reason = conf < 40 ? "No verified evidence yet and your confidence is low — start with the fundamentals." : "No verified evidence yet — confirm your fundamentals."; urgency = 60 + (1 - conf / 100) * 20; }
    else if (!sum.basic.passed) { level = "basic"; reason = `Basic score ${sum.basic.last}% is below the ${cfg.basic.passPct}% pass mark${weak.length ? " — repeated misses in " + weak.slice(0, 2).join(", ") : ""}.`; urgency = 85; }
    else if (!sum.intermediate.attempts) { level = "intermediate"; reason = `Basic passed (${sum.basic.best}%) — verify practical skills next.`; urgency = 50; }
    else if (!sum.intermediate.passed) { level = "intermediate"; reason = `Intermediate score ${sum.intermediate.last}% is below the ${cfg.intermediate.passPct}% pass mark${weak.length ? " — focus on " + weak.slice(0, 2).join(", ") : ""}.`; urgency = 70; }
    else if (!sum.advanced.attempts) { level = "advanced"; reason = `Intermediate passed (${sum.intermediate.best}%) — you are ready to be tested on production-level scenarios.`; urgency = 30; }
    else if (!sum.advanced.passed) { level = "advanced"; reason = `Advanced score ${sum.advanced.last}% is below the ${cfg.advanced.passPct}% pass mark — review ${weak.slice(0, 2).join(", ") || "the explanations"} and retry.`; urgency = 40; }
    if (level) recs.push({ skillId: sk.id, skillName: sk.name, level, reason, weakTopics: weak.slice(0, 3), priority: Math.round(urgency * (0.6 + sk.weight * 0.4)) });
  });
  return recs.sort((a, b) => b.priority - a.priority);
}
