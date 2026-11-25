const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");
const AS = require("./assessmentService");
const PS = require("./projectService");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-only-change-me") {
  throw new Error("Set JWT_SECRET in production.");
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_KEYS = ["githubData", "resumeData", "assessmentResults", "interviewResult", "completedProjects", "assessmentHistory", "interviewHistory", "projectState"];
const str = (v, max = 5000) => (typeof v === "string" ? v.slice(0, max) : "");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sign = (u) => jwt.sign({ uid: u.id }, JWT_SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!m) return res.status(401).json({ error: "Not signed in." });
  try { req.uid = jwt.verify(m[1], JWT_SECRET).uid; next(); }
  catch (e) { res.status(401).json({ error: "Session expired. Please log in again." }); }
}

// Very small in-memory limiter for login/signup (per IP) to blunt password guessing.
const hits = new Map();
function authLimiter(req, res, next) {
  const key = req.ip, now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < 60_000);
  if (arr.length >= 20) return res.status(429).json({ error: "Too many attempts. Try again in a minute." });
  arr.push(now); hits.set(key, arr); next();
}

function createApp(publicDir) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "6mb" }));

  app.get("/api/health", wrap(async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "postgres" });
  }));

  // ---- Auth ----
  app.post("/api/auth/signup", authLimiter, wrap(async (req, res) => {
    const name = str(req.body.name, 120).trim();
    const email = str(req.body.email, 254).trim();
    const password = str(req.body.password, 200);
    if (!name) return res.status(400).json({ error: "Enter your full name." });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "That doesn't look like a valid email." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email", [name, email, hash]);
      await pool.query("INSERT INTO profiles (user_id,name) VALUES ($1,$2)", [rows[0].id, name]);
      res.status(201).json({ token: sign(rows[0]), user: publicUser(rows[0]) });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
      throw e;
    }
  }));

  app.post("/api/auth/login", authLimiter, wrap(async (req, res) => {
    const email = str(req.body.email, 254).trim();
    const password = str(req.body.password, 200);
    const { rows } = await pool.query("SELECT * FROM users WHERE lower(email)=lower($1)", [email]);
    const ok = rows[0] && await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Incorrect email or password." });
    res.json({ token: sign(rows[0]), user: publicUser(rows[0]) });
  }));

  app.get("/api/auth/me", requireAuth, wrap(async (req, res) => {
    const { rows } = await pool.query("SELECT id,name,email FROM users WHERE id=$1", [req.uid]);
    if (!rows[0]) return res.status(401).json({ error: "Account not found." });
    res.json({ user: rows[0] });
  }));

  // ---- Everything the app persists for a signed-in user ----
  app.get("/api/state", requireAuth, wrap(async (req, res) => {
    const [p, sk, st] = await Promise.all([
      pool.query("SELECT * FROM profiles WHERE user_id=$1", [req.uid]),
      pool.query("SELECT skill_id,name,category FROM user_skills WHERE user_id=$1 ORDER BY position", [req.uid]),
      pool.query("SELECT key,value FROM user_state WHERE user_id=$1", [req.uid]),
    ]);
    const r = p.rows[0] || {};
    const skillSelections = sk.rows.map(s => ({ id: s.skill_id, name: s.name, category: s.category }));
    const out = {
      profile: {
        name: r.name || "", education: r.education || "", branch: r.branch || "", gradYear: r.grad_year || "",
        experience: r.experience || "", careerId: r.career_id || "", githubUsername: r.github_username || "",
        resumeText: r.resume_text || "", preferredTech: r.preferred_tech || [],
        careerLevel: r.career_level || "", secondaryCareers: r.secondary_careers || [], recentCareers: r.recent_careers || [],
        currentSkills: skillSelections.map(s => s.name), skillSelections,
      },
      githubData: null, resumeData: null, assessmentResults: {}, interviewResult: null, completedProjects: [], assessmentHistory: [], interviewHistory: [], projectState: {},
    };
    st.rows.forEach(row => { if (STATE_KEYS.includes(row.key)) out[row.key] = row.value; });
    res.json(out);
  }));

  app.put("/api/state", requireAuth, wrap(async (req, res) => {
    const body = req.body || {};
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (body.profile && typeof body.profile === "object") {
        const p = body.profile;
        const prefs = Array.isArray(p.preferredTech) ? p.preferredTech.filter(x => typeof x === "string").slice(0, 100) : [];
        const idList = (v, max) => (Array.isArray(v) ? v.filter(x => typeof x === "string").map(x => x.slice(0, 80)).slice(0, max) : []);
        await client.query(
          `INSERT INTO profiles (user_id,name,education,branch,grad_year,experience,career_id,github_username,resume_text,preferred_tech,career_level,secondary_careers,recent_careers,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
           ON CONFLICT (user_id) DO UPDATE SET name=$2,education=$3,branch=$4,grad_year=$5,experience=$6,career_id=$7,
             github_username=$8,resume_text=$9,preferred_tech=$10,career_level=$11,secondary_careers=$12,recent_careers=$13,updated_at=now()`,
          [req.uid, str(p.name, 120), str(p.education, 120), str(p.branch, 120), str(p.gradYear, 10), str(p.experience, 30),
           str(p.careerId, 60), str(p.githubUsername, 80), str(p.resumeText, 20000), JSON.stringify(prefs),
           str(p.careerLevel, 20), JSON.stringify(idList(p.secondaryCareers, 5)), JSON.stringify(idList(p.recentCareers, 8))]);

        // Skills: accept structured selections, or fall back to plain names (legacy)
        let sel = Array.isArray(p.skillSelections) ? p.skillSelections : (p.currentSkills || []).map(n => ({ id: "custom:" + String(n).toLowerCase(), name: n, category: "other" }));
        const seen = new Set();
        sel = sel.filter(s => s && typeof s.id === "string" && typeof s.name === "string" && !seen.has(s.id) && seen.add(s.id)).slice(0, 500);
        await client.query("DELETE FROM user_skills WHERE user_id=$1", [req.uid]);
        for (let i = 0; i < sel.length; i++) {
          await client.query("INSERT INTO user_skills (user_id,skill_id,name,category,position) VALUES ($1,$2,$3,$4,$5)",
            [req.uid, str(sel[i].id, 100), str(sel[i].name, 120), str(sel[i].category, 40) || "other", i]);
        }
        if (typeof p.name === "string" && p.name.trim()) await client.query("UPDATE users SET name=$2 WHERE id=$1", [req.uid, str(p.name, 120).trim()]);
      }
      // Interview history holds the candidate's answers: accept only a bounded array of plain objects.
      if ("interviewHistory" in body) {
        const h = Array.isArray(body.interviewHistory) ? body.interviewHistory.filter(e => e && typeof e === "object" && !Array.isArray(e)).slice(-60) : [];
        body.interviewHistory = h;
      }
      if ("projectState" in body) body.projectState = await PS.reconcileProjectState(client, req.uid, body.projectState);
      for (const key of STATE_KEYS) {
        if (key in body) {
          await client.query(
            `INSERT INTO user_state (user_id,key,value,updated_at) VALUES ($1,$2,$3,now())
             ON CONFLICT (user_id,key) DO UPDATE SET value=$3,updated_at=now()`,
            [req.uid, key, body[key] === null ? null : JSON.stringify(body[key])]);
        }
      }
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
  }));

  // ---- Dynamic career assessments (server-side generation + grading; answers never sent before submit) ----
  // ---- Proof-of-Skill projects ----
  app.get("/api/projects/catalogue", requireAuth, (req, res) => res.json(PS.catalogue(req.query)));
  app.post("/api/projects/:projectId/submit", requireAuth, wrap(async (req, res) => res.json(await PS.submit(req.uid, req.params.projectId, req.body))));
  app.get("/api/projects/submissions", requireAuth, wrap(async (req, res) => res.json({ submissions: await PS.history(req.uid, null) })));
  app.get("/api/projects/:projectId/submissions", requireAuth, wrap(async (req, res) => res.json({ submissions: await PS.history(req.uid, req.params.projectId) })));

  app.get("/api/assessment/config", requireAuth, wrap(async (req, res) => {
    res.json({ config: await AS.getConfig(), isAdmin: await AS.isAdmin(req.uid) });
  }));
  app.put("/api/assessment/config", requireAuth, wrap(async (req, res) => {
    if (!(await AS.isAdmin(req.uid))) return res.status(403).json({ error: "Only administrators can change assessment settings." });
    res.json({ config: await AS.setConfig(req.body && req.body.config, req.uid) });
  }));
  app.post("/api/assessment/start", requireAuth, wrap(async (req, res) => {
    res.json(await AS.start(req.uid, { skillId: str(req.body.skillId, 80), level: str(req.body.level, 20), careerId: str(req.body.careerId, 60) }));
  }));
  app.get("/api/assessment/history", requireAuth, wrap(async (req, res) => res.json({ history: await AS.history(req.uid) })));
  app.get("/api/assessment/recommendations", requireAuth, wrap(async (req, res) => res.json({ recommendations: await AS.recommendations(req.uid, str(req.query.careerId, 60)) })));
  app.get("/api/assessment/:id", requireAuth, wrap(async (req, res) => res.json(await AS.getAttempt(req.uid, req.params.id))));
  app.put("/api/assessment/:id/answers", requireAuth, wrap(async (req, res) => res.json(await AS.saveAnswers(req.uid, req.params.id, req.body && req.body.answers))));
  app.post("/api/assessment/:id/submit", requireAuth, wrap(async (req, res) => res.json(await AS.submit(req.uid, req.params.id, req.body || {}))));

  app.delete("/api/account", requireAuth, wrap(async (req, res) => {
    await pool.query("DELETE FROM users WHERE id=$1", [req.uid]);
    res.json({ ok: true });
  }));

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

  // Serve ONLY the single-file frontend (never the backend folder).
  if (publicDir) {
    app.get("/", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
    app.use("/vendor", express.static(path.join(publicDir, "vendor"), { fallthrough: false }));
  }

  app.use((err, req, res, next) => {
    if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
    console.error(err);
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
    res.status(500).json({ error: "Server error." });
  });
  return app;
}

module.exports = { createApp };
