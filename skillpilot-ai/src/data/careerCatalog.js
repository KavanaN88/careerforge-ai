// ============================================================================
// CAREER CATALOGUE — builds every career from careerSkills.js + careerRoles.js and exposes the
// search / recommendation / graph / readiness helpers the Target Career explorer uses.
//
// IMPORTANT: this file EXTENDS the existing global CAREERS array (mockData.js) in place:
//   • the 7 original careers keep their ids and hand-tuned skill graphs (so saved profiles,
//     assessments, projects and evidence keep working) and gain catalogue metadata;
//   • every other role is generated in the SAME shape ({id,name,icon,description,technologies,
//     skills:[{id,name,weight,deps}]}), so the Digital Twin, Roadmap, Assessments, Interview,
//     GitHub Analyzer, Resume Intelligence and Job Matcher work for all of them unchanged.
// ============================================================================

const ROLE_LEVELS = [
  { id: "entry",  label: "Entry level", years: "0–1 yrs", target: 60, desc: "Starting out — fundamentals and first real projects." },
  { id: "junior", label: "Junior",      years: "1–3 yrs", target: 70, desc: "Working independently on well-defined tasks." },
  { id: "mid",    label: "Mid level",   years: "3–5 yrs", target: 78, desc: "Owning features and systems end to end." },
  { id: "senior", label: "Senior",      years: "5+ yrs",  target: 85, desc: "Leading design, quality and other engineers." },
];
const LEVEL_BY_ID = {}; ROLE_LEVELS.forEach(l => { LEVEL_BY_ID[l.id] = l; });
// Default career level inferred from the experience chosen in onboarding Step 2.
function defaultCareerLevel(experience) {
  return { student: "entry", fresher: "entry", junior: "junior", mid: "mid" }[experience] || "entry";
}
function levelTarget(levelId) { return (LEVEL_BY_ID[levelId] || LEVEL_BY_ID.entry).target; }

const KIND_GROUPS = [
  { kind: "lang",  label: "Programming languages" },
  { kind: "fw",    label: "Frameworks & libraries" },
  { kind: "db",    label: "Databases" },
  { kind: "tool",  label: "Development tools" },
  { kind: "cloud", label: "Cloud platforms" },
  { kind: "cs",    label: "CS fundamentals & concepts" },
];

const CATEGORY_BY_ID = {};
CAREER_CATEGORIES.forEach(c => { CATEGORY_BY_ID[c.id] = c; });

function libSkillObject(id, idx, coreIds) {
  const lib = SKILL_LIB[id];
  return {
    id, name: lib.name,
    weight: Math.max(0.6, +(1 - idx * 0.04).toFixed(2)),
    deps: lib.deps.filter(d => coreIds.includes(d) && d !== id),
  };
}

function fillTemplate(t, skills) {
  const n = (i) => (skills[i] ? skills[i].name : "core technologies");
  return t.replace("{a}", n(0)).replace("{b}", n(1)).replace("{c}", n(2));
}

const CAREER_BY_ID = {};
CAREERS.forEach(c => { CAREER_BY_ID[c.id] = c; });

ROLE_DEFS.forEach(def => {
  const cat = CATEGORY_BY_ID[def.cat];
  let career = CAREER_BY_ID[def.id];
  const isNew = !career;
  if (isNew) {
    const skills = def.core.map((id, i) => libSkillObject(id, i, def.core));
    career = { id: def.id, name: def.name, icon: cat.icon, description: def.desc, technologies: def.tech, skills };
    CAREERS.push(career);
    CAREER_BY_ID[career.id] = career;
  }
  const inCore = {}; career.skills.forEach(s => { inCore[s.id] = 1; });
  career.category = def.cat;
  career.optionalSkills = def.opt.filter(id => !inCore[id] && SKILL_LIB[id])
    .map(id => ({ id, name: SKILL_LIB[id].name }));
  career.certifications = def.certs;
  career.relatedIds = def.related;
  career.keywords = def.kw;
  career.popular = def.popular;
  career.responsibilities = [
    ...cat.resp.map(t => fillTemplate(t, career.skills)),
    `Keep current with the ${cat.name.toLowerCase()} ecosystem and share what you learn with the team`,
  ];
  career.exampleProjects = [
    def.project,
    `Build and deploy a ${def.tech[0] || career.skills[0].name} + ${def.tech[1] || career.skills[1]?.name || "cloud"} project that demonstrates ${career.skills[Math.min(2, career.skills.length - 1)].name}`,
    `Contribute a documented fix or feature to an open-source ${def.tech[0] || career.skills[0].name} project`,
  ].filter(Boolean);
});

// Core skills for ALL careers must reference only skills that exist in this career (graph integrity).
CAREERS.forEach(c => { const ids = c.skills.map(s => s.id); c.skills.forEach(s => { s.deps = s.deps.filter(d => ids.includes(d)); }); });

// One proof-of-skill project template per generated role (Projects page filters by careerId).
ROLE_DEFS.forEach(def => {
  const career = CAREER_BY_ID[def.id];
  if (!def.core.length || !def.project) return;   // originals already have curated templates
  PROJECT_TEMPLATES.push({
    id: "role-" + def.id, careerId: def.id, name: def.name.replace(/ \/.*$/, "") + " Capstone",
    skills: career.skills.slice(0, 3).map(s => s.id),
    description: def.project,
    deliverable: "A public GitHub repo with a README (problem, architecture, how to run) and a working demo or screenshots.",
  });
});

const FEATURED_CAREER_IDS = ["cloud-engineer", "devops-engineer", "software-developer", "fullstack-developer", "aiml-engineer", "cybersecurity-engineer", "data-analyst"];

// ----------------------------------------------------------------------------------------------
// Projects / resources / assessments — fall back to generated content for skills without curation
// ----------------------------------------------------------------------------------------------
function projectsForCareer(career) {
  return PROJECT_TEMPLATES.filter(p => (!p.careerId || p.careerId === career.id) && p.skills.some(sid => career.skills.some(s => s.id === sid)));
}
function projectForSkill(career, skillId) {
  const list = projectsForCareer(career);
  return list.find(p => p.skills.includes(skillId) && !p.careerId) || list.find(p => p.skills.includes(skillId));
}

function skillResources(id, name) {
  if (SKILL_RESOURCES[id]) return SKILL_RESOURCES[id];
  return [`Official ${name} documentation and getting-started guide`, `Build and publish a small project that uses ${name}`];
}

const KIND_LABELS = { lang: "A programming language", fw: "A framework or library", db: "A database technology", tool: "A development tool", cloud: "A cloud platform", cs: "A concept or discipline" };

// Deterministic generated questions so every skill in every career can be assessed.
function assessmentQuestionsFor(skillId) {
  if (ASSESSMENT_BANK[skillId]) return ASSESSMENT_BANK[skillId];
  const lib = SKILL_LIB[skillId];
  if (!lib) return [];
  const others = Object.values(SKILL_LIB).filter(s => s.id !== skillId && s.purpose !== lib.purpose);
  const pick = (n, seed, pool) => {
    const out = []; let i = 0;
    while (out.length < n && i < 200) { const c = pool[Math.floor(seededRandom(hashString(skillId) + seed + i * 31) * pool.length)]; if (c && !out.includes(c)) out.push(c); i++; }
    return out;
  };
  const place = (correct, wrong, seed) => {
    const idx = Math.floor(seededRandom(hashString(skillId) + seed) * (wrong.length + 1));
    const options = [...wrong]; options.splice(idx, 0, correct);
    return { options, answer: idx };
  };
  const qs = [];
  const wrongP = pick(3, 11, others).map(s => s.purpose);
  qs.push({ q: `What is ${lib.name} primarily used for?`, ...place(lib.purpose, wrongP, 5) });
  if (lib.deps.length) {
    const dep = SKILL_LIB[lib.deps[0]];
    const wrongD = pick(3, 23, Object.values(SKILL_LIB).filter(s => s.id !== skillId && !lib.deps.includes(s.id) && s.kind !== dep.kind)).map(s => s.name);
    qs.push({ q: `Which of these is a common prerequisite to learn before ${lib.name}?`, ...place(dep.name, wrongD, 9) });
  } else {
    const wrongK = Object.keys(KIND_LABELS).filter(k => k !== lib.kind).slice(0, 3).map(k => KIND_LABELS[k]);
    qs.push({ q: `Which description best fits ${lib.name}?`, ...place(KIND_LABELS[lib.kind], wrongK, 9) });
  }
  return qs;
}

// ----------------------------------------------------------------------------------------------
// Claimed skills (from onboarding Step 3) and role matching
// ----------------------------------------------------------------------------------------------
function claimContext(currentSkills) {
  const selIds = {};
  dedupeSelections(currentSkills || []).forEach(s => { selIds[s.id] = 1; });
  return { selIds, nameSet: claimedNameSet(currentSkills || []) };
}
function isSkillClaimed(skill, ctx) {
  if (ctx.nameSet[normSkill(skill.name)]) return true;
  if (ctx.selIds[skill.id]) return true;
  const lib = SKILL_LIB[skill.id];
  return !!lib && lib.claims.some(c => ctx.selIds[c]);
}
// Weighted share of a career's core skills the person claims (0–100). This is a *claim* match
// used for discovery/recommendation only — readiness itself is evidence-based (see app.js).
function roleMatch(career, ctx) {
  let total = 0, have = 0;
  career.skills.forEach(s => { total += s.weight; if (isSkillClaimed(s, ctx)) have += s.weight; });
  return total ? Math.round((have / total) * 100) : 0;
}
function recommendCareers(ctx, n = 6, excludeIds = []) {
  const any = Object.keys(ctx.selIds).length > 0;
  const ranked = CAREERS.filter(c => !excludeIds.includes(c.id))
    .map(c => ({ c, m: roleMatch(c, ctx) }))
    .sort((a, b) => (b.m - a.m) || ((b.c.popular ? 1 : 0) - (a.c.popular ? 1 : 0)) || a.c.name.localeCompare(b.c.name));
  return (any ? ranked.filter(r => r.m > 0) : ranked.filter(r => r.c.popular)).slice(0, n).map(r => ({ career: r.c, match: r.m }));
}

// Evidence-based status of one skill: known / partial / improve / missing.
function skillStatus(score) {
  if (score >= 70) return { id: "known", label: "Strong", tone: "good" };
  if (score >= 40) return { id: "partial", label: "Partial", tone: "warn" };
  if (score > 0) return { id: "improve", label: "Needs evidence", tone: "cyan" };
  return { id: "missing", label: "Missing", tone: "bad" };
}

// ----------------------------------------------------------------------------------------------
// Search & filters
// ----------------------------------------------------------------------------------------------
function tokenize(q) { return normSkill(q).split(/[\s,]+/).filter(Boolean); }
function words(text) { return normSkill(text).split(/[^a-z0-9+#]+/).filter(Boolean); }
// whole-word match (so "java" does not match "JavaScript", "sql" does not match "NoSQL")
function wordMatch(text, tok) {
  return words(text).some(w => w === tok || (tok.length >= 5 && w.startsWith(tok)));
}
// looser match for titles/keywords: substring for longer words, word-prefix for short ones
function looseMatch(text, tok) {
  const t = normSkill(text);
  if (tok.length <= 3) return words(t).some(w => w.startsWith(tok));
  return t.includes(tok);
}

const SEARCH_INDEX = {};
CAREERS.forEach(c => {
  const cat = CATEGORY_BY_ID[c.category];
  SEARCH_INDEX[c.id] = {
    name: c.name, kw: c.keywords || "", cat: cat ? cat.name : "",
    core: c.skills.map(s => s.name).concat(c.skills.map(s => s.id)),
    tech: c.technologies || [],
    opt: (c.optionalSkills || []).map(s => s.name),
    desc: c.description,
  };
});

function scoreCareer(c, tokens) {
  const ix = SEARCH_INDEX[c.id]; let total = 0;
  for (const tok of tokens) {
    let s = 0;
    const name = normSkill(ix.name);
    if (name === tok) s = 120;
    else if (words(name).includes(tok)) s = 100;
    else if (looseMatch(name, tok)) s = 80;
    if (wordMatch(ix.kw, tok)) s = Math.max(s, 60);
    if (ix.core.some(x => wordMatch(x, tok))) s = Math.max(s, 50);
    if (ix.tech.some(x => wordMatch(x, tok))) s = Math.max(s, 45);
    if (looseMatch(ix.cat, tok)) s = Math.max(s, 35);
    if (ix.opt.some(x => wordMatch(x, tok))) s = Math.max(s, 25);
    if (tok.length > 3 && looseMatch(ix.desc, tok)) s = Math.max(s, 10);
    if (!s) return 0;           // every word must match somewhere
    total += s;
  }
  return total;
}

function searchCareers(query, opts = {}) {
  const { category, ids } = opts;
  let list = CAREERS;
  if (ids) list = list.filter(c => ids.includes(c.id));
  if (category && category !== "all") list = list.filter(c => c.category === category);
  const tokens = tokenize(query);
  if (!tokens.length) return list.map(c => ({ career: c, score: 0 }));
  return list.map(c => ({ career: c, score: scoreCareer(c, tokens) })).filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || ((b.career.popular ? 1 : 0) - (a.career.popular ? 1 : 0)) || a.career.name.localeCompare(b.career.name));
}

// ----------------------------------------------------------------------------------------------
// Dependency graph (generated from the career's own skill list, never hard-coded)
// ----------------------------------------------------------------------------------------------
function careerGraph(career) {
  const byId = {}; career.skills.forEach(s => { byId[s.id] = s; });
  const depth = {}; const visiting = {};
  const d = (id) => {
    if (depth[id] !== undefined) return depth[id];
    if (visiting[id]) return 0;
    visiting[id] = true;
    const s = byId[id]; const v = s.deps.filter(x => byId[x]).length ? Math.max(...s.deps.filter(x => byId[x]).map(d)) + 1 : 0;
    visiting[id] = false; depth[id] = v; return v;
  };
  career.skills.forEach(s => d(s.id));
  const columns = [];
  career.skills.forEach(s => { (columns[depth[s.id]] = columns[depth[s.id]] || []).push(s); });
  const edges = [];
  career.skills.forEach(s => s.deps.forEach(dep => { if (byId[dep]) edges.push({ from: dep, to: s.id }); }));
  const order = [...career.skills].sort((a, b) => depth[a.id] - depth[b.id] || b.weight - a.weight);
  return { depth, columns: columns.filter(Boolean), edges, order };
}

function careerSkillGroups(career) {
  const core = career.skills.map(s => ({ ...s, core: true }));
  const opt = (career.optionalSkills || []).map(s => ({ ...s, core: false }));
  return KIND_GROUPS.map(g => ({
    label: g.label,
    items: [...core, ...opt].filter(s => (SKILL_LIB[s.id] ? SKILL_LIB[s.id].kind : "cs") === g.kind),
  })).filter(g => g.items.length);
}
