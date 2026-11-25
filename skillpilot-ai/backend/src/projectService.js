// Server-side Proof-of-Skill project services: catalogue queries, GitHub evidence fetching, evaluation,
// verification and submission history. Uses the SAME engine as the browser (src/data/*.js).
// Security: the server only ever calls GITHUB_API_BASE (default https://api.github.com) with a strictly
// parsed owner/repo. It never fetches user-supplied URLs (deployment URLs are NOT fetched => no SSRF).
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

const DATA_DIR = process.env.SHARED_DATA_DIR ||
  [path.join(__dirname, "../shared"), path.join(__dirname, "../../src/data")].find(d => fs.existsSync(path.join(d, "projectEngine.js")));
const FILES = ["mockData", "engine", "skillCatalog", "careerSkills", "careerRoles", "careerCatalog", "projectCatalog", "projectEngine"];
const E = new Function(FILES.map(f => fs.readFileSync(path.join(DATA_DIR, f + ".js"), "utf8")).join("\n") +
  "\nreturn { PROJECTS, PROJECT_BY_ID, PROJECT_CATEGORIES, projectCatalogueStats, filterProjects, projectRoles, parseRepoUrl, fetchRepoEvidence, evaluateSubmission, evaluateEvidenceOnly, sanitizeProjectState };")();

const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
const err = (status, message) => Object.assign(new Error(message), { status });

async function ghFetchJson(p) {
  const base = process.env.GITHUB_API_BASE || "https://api.github.com";
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "SkillPilotAI" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let r;
  try { r = await fetch(base + p, { headers, signal: AbortSignal.timeout(12000) }); }
  catch (e) { throw err(502, "The server could not reach GitHub."); }
  if (!r.ok) throw err(r.status === 404 ? 404 : r.status === 403 || r.status === 429 ? 429 : 502, r.status === 404 ? "Repository not found (it must be public)." : r.status === 403 || r.status === 429 ? "GitHub API rate limit reached. Set GITHUB_TOKEN on the server or try later." : "GitHub returned " + r.status);
  return r.json();
}

const recent = new Map();
function throttle(uid) {
  const now = Date.now(); const a = (recent.get(uid) || []).filter(t => now - t < 60000);
  if (a.length >= 10) throw err(429, "Too many submissions. Try again in a minute.");
  a.push(now); recent.set(uid, a);
}

function catalogue(query) {
  const f = { q: str(query.q, 100), category: str(query.category, 30), level: str(query.level, 20), role: str(query.role, 80), lang: str(query.lang, 40), skill: str(query.skill, 40) };
  Object.keys(f).forEach(k => { if (!f[k]) delete f[k]; });
  const list = E.filterProjects(E.PROJECTS, f, {});
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50)), offset = Math.max(0, parseInt(query.offset, 10) || 0);
  return { stats: E.projectCatalogueStats(), total: list.length,
    projects: list.slice(offset, offset + limit).map(p => ({ id: p.id, name: p.name, category: p.category, level: p.level, description: p.description, skills: p.skills, duration: p.duration, languages: p.languages })) };
}

async function submit(uid, projectId, body) {
  const p = E.PROJECT_BY_ID[projectId]; if (!p) throw err(404, "Unknown project.");
  throttle(uid);
  const s = body && body.submission && typeof body.submission === "object" ? body.submission : {};
  const sub = { repoUrl: str(s.repoUrl, 300).trim(), deployUrl: str(s.deployUrl, 300).trim(), videoUrl: str(s.videoUrl, 300).trim(), docsText: str(s.docsText, 6000), testResults: str(s.testResults, 3000),
    screenshots: Array.isArray(s.screenshots) ? s.screenshots.slice(0, 8).map(x => str(x, 300)) : [], notes: str(s.notes, 1000), submittedAt: new Date().toISOString() };
  const prof = (await pool.query("SELECT github_username FROM profiles WHERE user_id=$1", [uid])).rows[0];
  const githubUsername = prof ? prof.github_username : "";
  const startedAt = str(body && body.startedAt, 40);
  let evaluation; const parsed = E.parseRepoUrl(sub.repoUrl);
  if (sub.repoUrl && !parsed) throw err(400, "That is not a GitHub repository URL (https://github.com/owner/repo).");
  if (parsed) {
    const ev = await E.fetchRepoEvidence(parsed.owner, parsed.repo, ghFetchJson);
    evaluation = E.evaluateSubmission(p, ev, { githubUsername, submission: sub, startedAt, verifiedBy: "server" });
  } else evaluation = E.evaluateEvidenceOnly(p, sub, {});
  const { rows } = await pool.query("SELECT COALESCE(MAX(attempt),0)+1 AS n FROM project_submissions WHERE user_id=$1 AND project_id=$2", [uid, projectId]);
  await pool.query(`INSERT INTO project_submissions (user_id,project_id,attempt,repo_url,mode,status,overall,evaluation,submission) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [uid, projectId, rows[0].n, sub.repoUrl, evaluation.mode, evaluation.verification.status, evaluation.overall, JSON.stringify(evaluation), JSON.stringify(sub)]);
  return { evaluation, attempt: rows[0].n };
}

async function history(uid, projectId) {
  const { rows } = await pool.query("SELECT attempt,repo_url,mode,status,overall,created_at FROM project_submissions WHERE user_id=$1 AND ($2::text IS NULL OR project_id=$2) ORDER BY created_at DESC LIMIT 100", [uid, projectId || null]);
  return rows;
}

// Integrity: a client may not promote itself to "verified". Keep "verified" only when the latest server
// submission for that project (same repository) was verified by the server.
async function reconcileProjectState(client, uid, raw) {
  const state = E.sanitizeProjectState(raw);
  for (const id of Object.keys(state)) {
    if (state[id].status !== "verified") continue;
    const { rows } = await client.query("SELECT status, repo_url FROM project_submissions WHERE user_id=$1 AND project_id=$2 ORDER BY attempt DESC LIMIT 1", [uid, id]);
    const ok = rows[0] && rows[0].status === "verified" && state[id].submission && rows[0].repo_url === state[id].submission.repoUrl;
    if (!ok) { state[id].status = "submitted"; if (state[id].evaluation && state[id].evaluation.verification) state[id].evaluation.verification = { ...state[id].evaluation.verification, status: "submitted", verifiedBy: null, reasons: ["Not confirmed by a server-side analysis."] }; }
  }
  return state;
}

module.exports = { catalogue, submit, history, reconcileProjectState, E };
