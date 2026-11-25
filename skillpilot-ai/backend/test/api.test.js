// Integration test — needs a running PostgreSQL (DATABASE_URL). Run: npm test
const { init, pool } = require("../src/db");
const { createApp } = require("../src/app");
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

(async () => {
  await init();
  const server = createApp(null).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const call = async (method, url, body, token) => {
    const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, data: await r.json().catch(() => ({})) };
  };
  const email = `t${Date.now()}@example.com`;
  process.env.ADMIN_EMAILS = email; // this test user is the admin

  ok((await call("GET", "/api/health")).data.ok, "health");
  ok((await call("POST", "/api/auth/signup", { name: "", email, password: "secret1" })).status === 400, "signup validates name");
  ok((await call("POST", "/api/auth/signup", { name: "A", email: "bad", password: "secret1" })).status === 400, "signup validates email");
  ok((await call("POST", "/api/auth/signup", { name: "A", email, password: "123" })).status === 400, "signup validates password");
  const s = await call("POST", "/api/auth/signup", { name: "Ada", email, password: "secret1" });
  ok(s.status === 201 && s.data.token, "signup ok");
  ok((await call("POST", "/api/auth/signup", { name: "Ada", email: email.toUpperCase(), password: "secret1" })).status === 409, "duplicate email (case-insens.) rejected");
  ok((await call("POST", "/api/auth/login", { email, password: "wrong" })).status === 401, "wrong password rejected");
  const l = await call("POST", "/api/auth/login", { email, password: "secret1" });
  ok(l.status === 200 && l.data.token, "login ok");
  const t = l.data.token;
  ok((await call("GET", "/api/state")).status === 401, "state needs auth");
  ok((await call("GET", "/api/auth/me", null, t)).data.user.email === email, "me");
  const { rows: [u] } = await pool.query("SELECT password_hash FROM users WHERE lower(email)=lower($1)", [email]);
  ok(u.password_hash.startsWith("$2"), "password stored hashed");

  const empty = await call("GET", "/api/state", null, t);
  ok(empty.data.profile.name === "Ada" && empty.data.completedProjects.length === 0, "initial state");

  const profile = { name: "Ada L", education: "B.Tech", branch: "CS", gradYear: "2026", experience: "student", careerId: "ai-ml",
    githubUsername: "ada", resumeText: "Python", preferredTech: ["Docker"],
    careerLevel: "junior", secondaryCareers: ["site-reliability-engineer", "platform-engineer"], recentCareers: ["cloud-architect"],
    currentSkills: ["Python", "JavaScript", "Python"],
    skillSelections: [{ id: "python", name: "Python", category: "languages" }, { id: "javascript", name: "JavaScript", category: "languages" }, { id: "python", name: "Python", category: "languages" }] };
  const put = await call("PUT", "/api/state", { profile, assessmentResults: { py: 80 }, completedProjects: ["p1"], githubData: { repos: 3 }, interviewResult: null }, t);
  ok(put.status === 200, "save state");
  const got = (await call("GET", "/api/state", null, t)).data;
  ok(got.profile.careerId === "ai-ml" && got.profile.education === "B.Tech", "profile roundtrip");
  ok(got.profile.careerLevel === "junior" && got.profile.secondaryCareers.join() === "site-reliability-engineer,platform-engineer" && got.profile.recentCareers[0] === "cloud-architect", "career level + secondary interests + recent roundtrip");
  ok(got.profile.skillSelections.length === 2 && got.profile.currentSkills.join() === "Python,JavaScript", "skills deduped + ordered");
  ok(got.assessmentResults.py === 80 && got.completedProjects[0] === "p1" && got.githubData.repos === 3, "evidence state roundtrip");
  const { rows } = await pool.query("SELECT count(*)::int n FROM user_skills WHERE user_id=(SELECT id FROM users WHERE email=$1)", [email]);
  ok(rows[0].n === 2, "user_skills rows in DB");

  // ---- assessments ----
  const A = (m, u, b, tok) => call(m, "/api/assessment" + u, b, tok || t);
  ok((await call("GET", "/api/assessment/config")).status === 401, "assessment needs auth");
  const cfg0 = (await A("GET", "/config")).data;
  ok(cfg0.config.levels.basic.questions === 10 && cfg0.config.levels.advanced.minutes === 40, "default level config (10/15, 15/25, 20/40)");
  ok((await A("POST", "/start", { skillId: "nope", level: "basic" })).status === 400, "unknown skill rejected");
  ok((await A("POST", "/start", { skillId: "python", level: "expert" })).status === 400, "unknown level rejected");
  const st = (await A("POST", "/start", { skillId: "python", level: "basic", careerId: "cloud-engineer" })).data;
  ok(st.attemptId && st.questions.length > 0 && st.questions.length <= 10, "start returns questions");
  ok(!JSON.stringify(st).match(/"answer"|"explain"/), "answers/explanations NOT exposed before submit");
  const again = (await A("POST", "/start", { skillId: "python", level: "basic" })).data;
  ok(again.attemptId === st.attemptId, "in-progress attempt is resumed, not duplicated");
  const q0 = st.questions[0];
  const sv = await A("PUT", `/${st.attemptId}/answers`, { answers: { [q0.id]: q0.multi ? [0] : 0, bogus: 1 } });
  ok(sv.data.saved === 1, "answers autosaved and sanitised");
  const resumed = (await A("GET", `/${st.attemptId}`)).data;
  ok(resumed.status === "in_progress" && resumed.answers[q0.id] !== undefined && !JSON.stringify(resumed).includes('"explain"'), "resume returns saved answers, still no key");
  const other = await call("POST", "/api/auth/signup", { name: "Eve", email: `e${Date.now()}@example.com`, password: "secret3" });
  ok((await A("GET", `/${st.attemptId}`, null, other.data.token)).status === 404, "another user cannot read the attempt");
  ok((await A("POST", `/${st.attemptId}/submit`, {}, other.data.token)).status === 404, "another user cannot submit it");
  const sub = await A("POST", `/${st.attemptId}/submit`, { answers: {} });
  ok(sub.status === 200 && sub.data.result.total === st.questions.length && sub.data.result.review[0].explain, "submit grades server-side with explanations");
  ok(sub.data.result.correct <= 1 && sub.data.result.unanswered >= st.questions.length - 1, "only saved answer counted (first answer from autosave)");
  ok(sub.data.assessmentResults.python !== undefined && sub.data.assessmentHistory.length === 1, "result merged into evidence state");
  ok((await A("POST", `/${st.attemptId}/submit`, {})).data.alreadySubmitted, "double submit is idempotent");
  ok((await A("PUT", `/${st.attemptId}/answers`, { answers: {} })).status === 409, "cannot edit answers after submit");
  const st2 = (await call("GET", "/api/state", null, t)).data;
  ok(st2.assessmentHistory.length === 1 && st2.assessmentResults.python !== undefined, "/api/state exposes assessmentHistory + results");
  ok((await A("GET", "/history")).data.history.length === 1, "history endpoint");
  const recs = (await A("GET", "/recommendations?careerId=cloud-engineer")).data.recommendations;
  ok(Array.isArray(recs) && recs.length > 0 && !recs.some(r => r.level === "advanced"), "recommendations never jump straight to advanced");
  ok((await A("PUT", "/config", { config: {} }, other.data.token)).status === 403, "non-admin cannot change config");
  const adm = (await A("PUT", "/config", { config: { levels: { basic: { questions: 3, minutes: 5, passPct: 50, formats: ["mcq"] } } } })).data;
  ok(adm.config && adm.config.levels.basic.questions === 3, "admin can change config");
  const st3 = (await A("POST", "/start", { skillId: "docker", level: "basic" })).data;
  ok(st3.questions.length <= 3 && st3.limitSec === 300 && st3.questions.every(q => q.type === "mcq"), "new settings (count/time/format) honoured");
  await A("PUT", "/config", { config: { levels: { basic: { questions: 9999, minutes: -4, passPct: 500, formats: ["bad"] } } } });
  const cl = (await A("GET", "/config")).data.config.levels.basic;
  ok(cl.questions === 50 && cl.minutes === 1 && cl.passPct === 100 && cl.formats.length === 6, "config is clamped/sanitised");
  await A("PUT", "/config", { config: {} });
  await call("DELETE", "/api/account", null, other.data.token);

  // ---- interview history ----
  const entry = (i) => ({ id: "iv-" + i, at: new Date().toISOString(), category: "technical", level: "basic", overall: 50 + i, scores: { technical: 50, communication: 60, problemSolving: 55, practical: 40 }, questions: [{ n: 1, q: "What is EC2?", a: "answer " + i, score: 70 }] });
  ok((await call("PUT", "/api/state", { interviewHistory: [entry(1), "junk", null, entry(2)] }, t)).status === 200, "interview history saved");
  const ih = (await call("GET", "/api/state", null, t)).data.interviewHistory;
  ok(ih.length === 2 && ih[1].questions[0].a === "answer 2", "interview history round-trips; junk entries dropped");
  await call("PUT", "/api/state", { interviewHistory: "nope" }, t);
  ok((await call("GET", "/api/state", null, t)).data.interviewHistory.length === 0, "non-array interview history rejected");
  await call("PUT", "/api/state", { interviewHistory: Array.from({ length: 80 }, (_, i) => entry(i)) }, t);
  ok((await call("GET", "/api/state", null, t)).data.interviewHistory.length === 60, "interview history capped at 60");

  // ---- proof-of-skill projects (pmock GitHub) ----
  const http = require("http");
  const pb64 = (x) => Buffer.from(x).toString("base64");
  const pgfiles = ["README.md", "app/main.py", "app/api/routes.py", "app/services/s.py", "tests/test_main.py", "tests/test_api.py", "Dockerfile", "docker-compose.yml", "requirements.txt", ".gitignore", ".github/workflows/ci.yml", "docs/architecture.md", "nginx/nginx.conf", "deploy.sh", ".eslintrc"];
  let pgmode = { fork: false, owner: "alice" };
  const pmock = http.createServer((rq, rs) => {
    const u = rq.url.split("?")[0]; const J = (o, c = 200) => { rs.writeHead(c, { "Content-Type": "application/json" }); rs.end(JSON.stringify(o)); };
    if (u.includes("/nope")) return J({ message: "Not Found" }, 404);
    if (u.endsWith("/languages")) return J({ Python: 5000, Shell: 300 });
    if (u.includes("/git/trees")) return J({ tree: pgfiles.map(p => ({ type: "blob", path: p })) });
    if (u.includes("/commits")) return J(Array.from({ length: 20 }, (_, i) => ({ author: { login: pgmode.owner }, commit: { message: "Add feature number " + i, author: { date: new Date(Date.now() - i * 86400000).toISOString() } } })));
    if (u.endsWith("/readme")) return J({ content: pb64("# Blue green\n## Setup\nrun docker compose up\n## Architecture\nnginx docker pytest ci. ".repeat(12) + "\n![x](a.png)") });
    if (u.includes("/contents/")) return J({ content: pb64("flask\npytest") });
    J({ full_name: pgmode.owner + "/bg", fork: pgmode.fork, created_at: new Date(Date.now() - 30 * 86400000).toISOString(), pushed_at: new Date().toISOString(), default_branch: "main", owner: { login: pgmode.owner }, stargazers_count: 0, size: 10 });
  }).listen(0);
  process.env.GITHUB_API_BASE = "http://127.0.0.1:" + pmock.address().port;
  await call("PUT", "/api/state", { profile: { name: "Tester", careerId: "cloud-engineer", githubUsername: "alice" } }, t);
  const pcat = (await call("GET", "/api/projects/catalogue?category=devops&level=basic", null, t)).data;
  ok(pcat.total === 3 && pcat.stats.total === 270, "project catalogue query (270 total, 3 devops basic)");
  const pid = pcat.projects[0].id;
  ok((await call("GET", "/api/projects/catalogue")).status === 401, "catalogue requires auth");
  ok((await call("POST", "/api/projects/NOPE/submit", { submission: {} }, t)).status === 404, "unknown project 404");
  ok((await call("POST", `/api/projects/${pid}/submit`, { submission: { repoUrl: "https://evil.example.com/a/b" } }, t)).status === 400, "non-GitHub URL rejected (no SSRF)");
  ok((await call("POST", `/api/projects/${pid}/submit`, { submission: { repoUrl: "https://github.com/alice/nope" } }, t)).status === 404, "missing repo -> 404");
  const psv = await call("POST", `/api/projects/${pid}/submit`, { submission: { repoUrl: "https://github.com/alice/bg", deployUrl: "https://internal.local/x" } }, t);
  ok(psv.status === 200 && psv.data.evaluation.verification.status === "verified" && psv.data.evaluation.verification.verifiedBy === "server", "server verifies owned, original repo: " + JSON.stringify(psv.data.evaluation && psv.data.evaluation.verification.reasons));
  ok(psv.data.attempt === 1, "attempt numbered");
  // state integrity: client cannot promote itself to verified
  const pfake = { [pid]: { status: "verified", submission: { repoUrl: "https://github.com/alice/other" }, evaluation: { skills: [{ id: "docker", state: "detected" }], verification: { status: "verified" } }, tasks: { "plan-1": true, evil: true } } };
  await call("PUT", "/api/state", { projectState: pfake }, t);
  let pps = (await call("GET", "/api/state", null, t)).data.projectState;
  ok(pps[pid].status === "submitted" && !pps[pid].tasks.evil && pps[pid].tasks["plan-1"], "forged verified status downgraded, task keys sanitised");
  pfake[pid].submission.repoUrl = "https://github.com/alice/bg";
  await call("PUT", "/api/state", { projectState: pfake }, t);
  pps = (await call("GET", "/api/state", null, t)).data.projectState;
  ok(pps[pid].status === "verified", "server-verified submission keeps verified status");
  ok((await call("PUT", "/api/state", { projectState: { "../x": { status: "verified" }, [pid]: "junk" } }, t)).status === 200 && Object.keys((await call("GET", "/api/state", null, t)).data.projectState).length === 0, "junk project state dropped");
  pgmode = { fork: false, owner: "mallory" };
  const pmm = await call("POST", `/api/projects/${pid}/submit`, { submission: { repoUrl: "https://github.com/mallory/bg" } }, t);
  ok(pmm.data.evaluation.verification.status === "submitted" && pmm.data.evaluation.flags.some(f => f.level === "red"), "someone else's repository is not verified");
  pgmode = { fork: true, owner: "alice" };
  const pfk = await call("POST", `/api/projects/${pid}/submit`, { submission: { repoUrl: "https://github.com/alice/bg" } }, t);
  ok(pfk.data.evaluation.verification.status === "submitted", "fork is not verified");
  const peo = await call("POST", `/api/projects/${pid}/submit`, { submission: { docsText: "x".repeat(600), testResults: "10 passed" } }, t);
  ok(peo.data.evaluation.mode === "evidence-only" && peo.data.evaluation.verification.status === "submitted", "evidence-only submission never verified");
  const phs = (await call("GET", `/api/projects/${pid}/submissions`, null, t)).data.submissions;
  ok(phs.length === 4 && phs[phs.length - 1].status === "verified", "submission history stored (4 attempts)");
  pmock.close();

  // second user isolation
  const e2 = `u${Date.now()}@example.com`;
  const s2 = await call("POST", "/api/auth/signup", { name: "Bob", email: e2, password: "secret2" });
  const g2 = (await call("GET", "/api/state", null, s2.data.token)).data;
  ok(g2.profile.skillSelections.length === 0 && g2.profile.careerId === "", "users are isolated");
  ok(g2.interviewHistory.length === 0, "interview history isolated per user");

  ok((await call("DELETE", "/api/account", null, s2.data.token)).data.ok, "delete account");
  const { rows: [me] } = await pool.query("SELECT id FROM users WHERE lower(email)=lower($1)", [email]);
  await call("DELETE", "/api/account", null, t);
  const left = await pool.query("SELECT count(*)::int n FROM user_skills WHERE user_id=$1", [me.id]);
  ok(left.rows[0].n === 0, "cascade delete");
  server.close(); await pool.end();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
