// Server-side assessment services: question generation, answer evaluation, analytics,
// recommendations and evidence merge. The question/answer engine is the SAME code the browser uses
// (src/data/*.js), loaded here so questions are identical and grading is authoritative.
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

const DATA_DIR = process.env.SHARED_DATA_DIR ||
  [path.join(__dirname, "../shared"), path.join(__dirname, "../../src/data")].find(d => fs.existsSync(path.join(d, "assessmentEngine.js")));
const FILES = ["mockData", "engine", "skillCatalog", "careerSkills", "careerRoles", "careerCatalog", "assessmentBank", "assessmentEngine"];
const E = new Function(FILES.map(f => fs.readFileSync(path.join(DATA_DIR, f + ".js"), "utf8")).join("\n") +
  "\nreturn { SKILL_LIB, CAREER_BY_ID, ASSESSMENT_LEVEL_IDS, buildAssessment, publicQuestions, gradeAssessment, historyEntry, skillComposite, compositeToTen, skillLevelSummary, recommendNext, normalizeAssessmentConfig, defaultAssessmentConfig, poolSize };")();

async function getConfig() {
  const { rows } = await pool.query("SELECT value FROM assessment_config WHERE key='default'");
  return E.normalizeAssessmentConfig(rows[0] && rows[0].value);
}
async function setConfig(cfg, uid) {
  const clean = E.normalizeAssessmentConfig(cfg);
  await pool.query(`INSERT INTO assessment_config (key,value,updated_by,updated_at) VALUES ('default',$1,$2,now())
    ON CONFLICT (key) DO UPDATE SET value=$1,updated_by=$2,updated_at=now()`, [JSON.stringify(clean), uid]);
  return clean;
}
async function isAdmin(uid) {
  const { rows } = await pool.query("SELECT id,email FROM users WHERE id=$1", [uid]);
  if (!rows[0]) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (list.length) return list.includes(rows[0].email.toLowerCase());
  const first = await pool.query("SELECT min(id) AS id FROM users");       // no ADMIN_EMAILS: first account is admin
  return first.rows[0].id === uid;
}

async function recentQuestionIds(uid, skillId, level) {
  const { rows } = await pool.query(
    "SELECT questions FROM assessment_attempts WHERE user_id=$1 AND skill_id=$2 AND level=$3 AND status='submitted' ORDER BY started_at DESC LIMIT 3", [uid, skillId, level]);
  return rows.flatMap(r => (r.questions || []).map(q => q.id));
}

async function start(uid, { skillId, level, careerId }) {
  if (!E.SKILL_LIB[skillId]) { const e = new Error("Unknown skill."); e.status = 400; throw e; }
  if (!E.ASSESSMENT_LEVEL_IDS.includes(level)) { const e = new Error("Unknown level."); e.status = 400; throw e; }
  const cfg = await getConfig(); const lc = cfg.levels[level];
  if (!lc.enabled) { const e = new Error("This level is currently disabled."); e.status = 403; throw e; }
  // Resume an in-progress, unexpired attempt rather than creating duplicates.
  const open = await pool.query(`SELECT * FROM assessment_attempts WHERE user_id=$1 AND skill_id=$2 AND level=$3 AND status='in_progress'
    AND started_at + (time_limit_sec || ' seconds')::interval > now() ORDER BY id DESC LIMIT 1`, [uid, skillId, level]);
  if (open.rows[0]) return startPayload(open.rows[0]);
  await pool.query("UPDATE assessment_attempts SET status='expired' WHERE user_id=$1 AND skill_id=$2 AND level=$3 AND status='in_progress'", [uid, skillId, level]);
  const exclude = await recentQuestionIds(uid, skillId, level);
  const questions = E.buildAssessment(skillId, level, cfg, { seed: `${uid}:${skillId}:${level}:${Date.now()}:${Math.random()}`, exclude });
  if (!questions.length) { const e = new Error("No questions are available for this skill/format combination."); e.status = 409; throw e; }
  const { rows } = await pool.query(
    `INSERT INTO assessment_attempts (user_id,skill_id,career_id,level,questions,answers,settings,time_limit_sec)
     VALUES ($1,$2,$3,$4,$5,'{}',$6,$7) RETURNING *`,
    [uid, skillId, String(careerId || "").slice(0, 60), level, JSON.stringify(questions), JSON.stringify(lc), lc.minutes * 60]);
  return startPayload(rows[0]);
}
function startPayload(a) {
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000));
  return { attemptId: a.id, skillId: a.skill_id, level: a.level, settings: a.settings, limitSec: a.time_limit_sec,
    remainingSec: Math.max(0, a.time_limit_sec - elapsed), questions: E.publicQuestions(a.questions), answers: a.answers || {} };
}

async function loadOwn(uid, id) {
  const { rows } = await pool.query("SELECT * FROM assessment_attempts WHERE id=$1 AND user_id=$2", [parseInt(id, 10) || 0, uid]);
  if (!rows[0]) { const e = new Error("Attempt not found."); e.status = 404; throw e; }
  return rows[0];
}
function cleanAnswers(questions, raw) {
  const out = {}; const byId = {}; questions.forEach(q => { byId[q.id] = q; });
  Object.keys(raw && typeof raw === "object" ? raw : {}).forEach(id => {
    const q = byId[id]; if (!q) return; const v = raw[id]; const max = q.options.length;
    if (Array.isArray(v)) { const a = [...new Set(v.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < max))]; if (a.length && q.type === "multi") out[id] = a; }
    else if (Number.isInteger(Number(v)) && v !== null && v !== "" && Number(v) >= 0 && Number(v) < max && q.type !== "multi") out[id] = Number(v);
  });
  return out;
}
async function saveAnswers(uid, id, answers) {
  const a = await loadOwn(uid, id);
  if (a.status !== "in_progress") { const e = new Error("This attempt is already finished."); e.status = 409; throw e; }
  const clean = cleanAnswers(a.questions, answers);
  await pool.query("UPDATE assessment_attempts SET answers=$2 WHERE id=$1", [a.id, JSON.stringify(clean)]);
  return { ok: true, saved: Object.keys(clean).length };
}

async function mergeUserState(client, uid, skillId, entry, composite) {
  const cur = await client.query("SELECT key,value FROM user_state WHERE user_id=$1 AND key IN ('assessmentResults','assessmentHistory') FOR UPDATE", [uid]);
  const m = {}; cur.rows.forEach(r => { m[r.key] = r.value; });
  const results = { ...(m.assessmentResults || {}), [skillId]: E.compositeToTen(composite) };
  const history = [...(Array.isArray(m.assessmentHistory) ? m.assessmentHistory : []), entry].slice(-500);
  for (const [k, v] of [["assessmentResults", results], ["assessmentHistory", history]]) {
    await client.query(`INSERT INTO user_state (user_id,key,value,updated_at) VALUES ($1,$2,$3,now())
      ON CONFLICT (user_id,key) DO UPDATE SET value=$3,updated_at=now()`, [uid, k, JSON.stringify(v)]);
  }
  return { results, history };
}

async function submit(uid, id, { answers, elapsedSec }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM assessment_attempts WHERE id=$1 AND user_id=$2 FOR UPDATE", [parseInt(id, 10) || 0, uid]);
    const a = rows[0];
    if (!a) { const e = new Error("Attempt not found."); e.status = 404; throw e; }
    if (a.status === "submitted") { await client.query("ROLLBACK"); return { alreadySubmitted: true, ...(await resultPayload(a)) }; }
    const merged = { ...(a.answers || {}), ...cleanAnswers(a.questions, answers) };
    const serverElapsed = Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000);
    const late = serverElapsed > a.time_limit_sec + 30;
    const timeSec = Math.min(a.time_limit_sec, Math.max(0, serverElapsed));
    const result = E.gradeAssessment(a.questions, merged, { passPct: a.settings.passPct, elapsedSec: timeSec });
    const entry = E.historyEntry({ id: "srv-" + a.id, skillId: a.skill_id, careerId: a.career_id, level: a.level, limitSec: a.time_limit_sec }, result);
    await client.query(`UPDATE assessment_attempts SET status='submitted',answers=$2,result=$3,pct=$4,passed=$5,submitted_at=now() WHERE id=$1`,
      [a.id, JSON.stringify(merged), JSON.stringify(result), result.pct, result.passed]);
    const hist = await client.query("SELECT skill_id,level,pct,passed,started_at FROM assessment_attempts WHERE user_id=$1 AND skill_id=$2 AND status='submitted'", [uid, a.skill_id]);
    const forComposite = hist.rows.map(r => ({ skillId: r.skill_id, level: r.level, pct: r.pct, passed: r.passed, at: new Date(r.started_at).toISOString() }));
    const composite = E.skillComposite(forComposite, a.skill_id);
    const state = await mergeUserState(client, uid, a.skill_id, entry, composite);
    await client.query("COMMIT");
    return { attemptId: a.id, late, result, entry, composite, score10: E.compositeToTen(composite), assessmentResults: state.results, assessmentHistory: state.history };
  } catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; }
  finally { client.release(); }
}
async function resultPayload(a) {
  return { attemptId: a.id, result: a.result, entry: null };
}
async function getAttempt(uid, id) {
  const a = await loadOwn(uid, id);
  if (a.status === "submitted") return { status: a.status, ...(await resultPayload(a)) };
  return { status: a.status, ...startPayload(a) };
}
async function history(uid) {
  const { rows } = await pool.query(
    `SELECT id,skill_id,career_id,level,pct,passed,started_at,submitted_at,result FROM assessment_attempts WHERE user_id=$1 AND status='submitted' ORDER BY started_at DESC LIMIT 200`, [uid]);
  return rows.map(r => ({ id: r.id, skillId: r.skill_id, skillName: (E.SKILL_LIB[r.skill_id] || {}).name || r.skill_id, careerId: r.career_id, level: r.level, pct: r.pct, passed: r.passed,
    at: r.started_at, correct: r.result && r.result.correct, total: r.result && r.result.total, timeSec: r.result && r.result.timeSec }));
}
async function recommendations(uid, careerId) {
  const career = E.CAREER_BY_ID[careerId]; if (!career) { const e = new Error("Unknown career."); e.status = 400; throw e; }
  const h = await history(uid);
  const entries = h.map(x => ({ ...x, at: new Date(x.at).toISOString(), topics: [] }));
  return E.recommendNext(career, entries, {}, await getConfig());
}
module.exports = { getConfig, setConfig, isAdmin, start, saveAnswers, submit, getAttempt, history, recommendations, E };
