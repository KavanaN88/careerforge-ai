# SkillPilot AI — Prove Your Skills. Build Your Career.

An evidence-based **Career Digital Twin**. Instead of trusting what you *claim*, SkillPilot combines your skills, resume, GitHub, assessments, interviews and verified projects into a per-skill confidence score and a career-readiness score, then tells you what to do next.

Two ways to run it: **demo mode** (just open a file) or **full mode** (Node.js + PostgreSQL + pgAdmin via Docker).

---

## 1. Quick start

### Option A — Demo mode (no install, no backend)
1. Unzip the project.
2. Open the **root** `index.html` in Chrome or Edge (double-click, or VS Code → *Live Server* → "Open with Live Server").
   Do **not** open `src/index.html` (that is the developer loader and needs a server).
3. Everything is saved in your browser (localStorage).

React, Babel and compiled Tailwind CSS are bundled in `vendor/`, so no CDN is needed. Only Google Fonts load from the internet; if blocked, system fonts are used.

### Option B — Full mode with Docker (backend + frontend + PostgreSQL + pgAdmin)
Requires Docker Desktop (running).

```bash
cd skillpilot-ai
docker compose up --build
```

| Service    | URL                    | Notes                                              |
|------------|------------------------|----------------------------------------------------|
| App (API + frontend) | http://localhost:3000 | Sign up here; data is stored in PostgreSQL |
| pgAdmin    | http://localhost:5050  | Login `admin@skillpilot.dev` / `admin`             |
| PostgreSQL | localhost:5432         | DB `skillpilot`, user `skillpilot`, password `skillpilot` |

Wait for `SkillPilot AI running → http://localhost:3000` in the log. First build takes several minutes (image downloads).

In pgAdmin: *Add New Server* → Host `db`, Port `5432`, DB `skillpilot`, User/Password `skillpilot`.

Stop: `Ctrl+C`, then `docker compose down`. Reset all data: `docker compose down -v`.

Optional environment variables (set before `docker compose up`, or edit `docker-compose.yml`):

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | **Change before deploying.** Signs login tokens. |
| `ADMIN_EMAILS` | Comma-separated admins allowed to change assessment settings (empty = first registered account). |
| `GITHUB_TOKEN` | Raises the GitHub API limit from 60 to 5,000 requests/hour for project verification. |

### Option C — Full mode without Docker
Requires Node.js 18+ and PostgreSQL.

```bash
createdb skillpilot            # plus a user/password matching DATABASE_URL
cd skillpilot-ai/backend
cp .env.example .env           # edit DATABASE_URL / JWT_SECRET if needed
npm install
npm start                      # → http://localhost:3000
```
Tables are created automatically on first start.

### Troubleshooting
| Symptom | Fix |
|---|---|
| "SkillPilot AI failed to start … Babel is not defined" | You opened `src/index.html` or an old copy. Open the root `index.html` from the latest zip and hard-refresh (Ctrl+Shift+R). |
| Blank page | Hard-refresh; open the browser console (F12) and check for errors. |
| "port is already allocated" | Another program uses 3000/5432/5050. Stop it or change the left-hand port number in `docker-compose.yml`. |
| Backend exits with a DB connection error | The DB was still starting; run `docker compose up` again. |
| Login works in demo mode but data "disappears" | Demo data lives in that browser only. Use full mode to persist in PostgreSQL. |
| GitHub verification says "rate limit" | Set `GITHUB_TOKEN`, or wait (60 requests/hour unauthenticated). |

---

## 2. Features

- **Landing, signup/login, 4-step onboarding** with a searchable skills picker (languages, frameworks, databases, platforms, tools, concepts + custom skills).
- **Career Role Explorer** — 174 roles in 28 categories, primary + secondary careers, level targets (Beginner → Senior).
- **Dashboard & Digital Twin** — per-skill confidence, readiness score, critical gaps, next-best-action, notifications.
- **GitHub Analyzer** and **Resume Intelligence** — evidence signals feeding the twin.
- **Job Matcher**, **Roadmap**, **Progress**, **Career Report** (printable).
- **AI Assessment** — dynamic, 3 levels per skill, server-side grading, history, composite evidence.
- **AI Interview Simulator** — 6 categories × 3 levels, adaptive follow-ups, rubric scoring, in-browser code execution, history and analytics.
- **Proof-of-Skill Project Platform** — see section 3.
- **Assistant** panel with context from your twin.
- **Settings/Profile** — edit profile, skills, GitHub username, clear demo data, delete account.

### How evidence becomes a score
Per skill: `computeSkillConfidence` combines resume mention, GitHub project evidence, deployment evidence (verified projects), assessment score, interview score and a small bonus for self-claims. Readiness weights: skills 28%, GitHub 15%, resume 12%, projects 20%, assessment 15%, interview 10%.

---

## 3. Proof-of-Skill Project Platform

**Catalogue** — 270 distinct projects: 30 categories × Basic / Intermediate / Advanced × 3. Every one of the 174 careers has projects at all three levels. Each project has ID, real-world problem, objectives, required skills, languages/frameworks/databases/tools, duration, complexity, prerequisites, deliverables, evaluation criteria and related projects. Add a project by adding **one line** to `src/data/projectCatalog.js`; `src/data/projectEngine.js` generates phases, tasks, checklists, architecture/workflow diagrams and, where the project has entities, a DB schema and API design.

**Discovery** — tabs: Recommended, All, Career-based, Basic, Intermediate, Advanced, Recently viewed, In-progress, Completed. Search plus filters (career role, category, difficulty, language, framework/tool, duration, required skill, status). Recommendations use primary/secondary career, skill-confidence gaps, level fit (auto-estimated or chosen), known skills, GitHub and resume gaps, and explain *why* each project is recommended.

**Workspace** — phased tasks with checkboxes, testing and deployment checklists, repo skeleton, notes, pause/resume, auto-save (localStorage; PostgreSQL when signed in).

**AI Project Mentor** — rule-based (no LLM). Explains requirements, architecture and technologies, suggests the next step, diagnoses pasted errors (~17 patterns), explains/reviews pasted code, reviews decisions, outlines README and final report. It refuses to write the whole project.

**Verification** — three distinct states:

| State | Meaning | Adds Digital Twin evidence? |
|---|---|---|
| Self-reported | You marked it complete | No |
| Evidence submitted | Links/text recorded and scored | No |
| **Verified** | Public GitHub repo analysed live | **Yes — only for skills detected in the code** |

"Verified" requires: successful live repository analysis (file tree, languages, manifests, README, up to 100 commits); repository ownership matching **Profile → GitHub username**; no originality red flags (fork, single bulk commit, owner/author mismatch); overall score ≥ 65, skill coverage ≥ 55% and ≥ 60% of requirements met. Resubmission is always allowed and can lower a status.

- **Signed in to the backend:** analysis runs on the server (`POST /api/projects/:id/submit`), attempts are stored in `project_submissions`, and the server refuses to let the client promote itself to "verified" via `/api/state`. The server only contacts the GitHub API with a strictly parsed `owner/repo` — never user-supplied URLs.
- **Demo mode:** analysis runs in the browser against the GitHub API (public repos, 60 requests/hour).

**Using it:** set your GitHub username in Settings → open *Proof-of-Skill Projects* → pick a project → *Start project* → work through tasks → *Submission* tab → paste your repo URL → *Submit & analyse*.

---

## 4. Project structure

```
skillpilot-ai/
├── index.html              # generated single-file app (open this)
├── vendor/                 # React, ReactDOM, Babel, compiled Tailwind (offline)
├── src/
│   ├── index.html          # dev loader (needs a static server)
│   ├── build.sh            # bundles src/ into the root index.html
│   ├── app.js              # state, persistence, evidence wiring, routing
│   ├── styles.css
│   ├── components/         # UI (Landing, Auth, Onboarding, Dashboard, DigitalTwin,
│   │                       #   Assessment, Interview, Projects, Roadmap, Report, …)
│   └── data/               # engines + catalogues shared with the backend
│       ├── engine.js, skillCatalog.js, careerSkills.js, careerRoles.js, careerCatalog.js
│       ├── assessmentBank.js, assessmentEngine.js
│       ├── interviewBank.js, interviewEngine.js
│       ├── projectCatalog.js, projectEngine.js
│       └── api.js          # backend client with automatic demo-mode fallback
├── backend/
│   ├── src/ (server.js, app.js, db.js, assessmentService.js, projectService.js)
│   ├── db/schema.sql       # users, profiles, user_skills, user_state,
│   │                       #   assessment_config, assessment_attempts, project_submissions
│   ├── test/api.test.js    # integration tests (63 checks)
│   └── Dockerfile
├── docker-compose.yml      # db + api(+frontend) + pgAdmin
├── tailwind.config.js, in.css   # inputs to rebuild vendor/tailwind.css
└── README.md
```

### Editing the frontend
Edit files in `src/`, then regenerate the single-file app:
```bash
bash src/build.sh
```
New data/component files must be added to both the file list in `src/build.sh` and the `FILES` array in `src/index.html` (data files before components). If you add new Tailwind classes, rebuild the CSS:
```bash
npx tailwindcss@3 -c tailwind.config.js -i in.css -o vendor/tailwind.css --minify
```

### Backend API (all `/api/*` except auth/health need `Authorization: Bearer <token>`)
`GET /api/health` · `POST /api/auth/signup|login` · `GET /api/auth/me` · `GET|PUT /api/state` · `DELETE /api/account` · `/api/assessment/*` · `GET /api/projects/catalogue` · `POST /api/projects/:id/submit` · `GET /api/projects/submissions` · `GET /api/projects/:id/submissions`

### Tests
```bash
cd backend && npm install && npm test     # needs PostgreSQL via DATABASE_URL
```

---

## 5. What is real vs. simulated

**Real:** accounts, JWT auth (bcrypt), PostgreSQL persistence, skill/career catalogue, assessment generation and server-side grading, interview rubric evaluation and JS code execution (sandboxed Worker), project catalogue/recommendations, live GitHub repository analysis for project verification, evidence scoring.

**Simulated / limited:**
- The standalone **GitHub Analyzer** on the dashboard derives sample data from the username (it does not call GitHub). Project verification *does* call GitHub.
- **Resume Intelligence** is keyword matching, not a language model.
- The **AI Project Mentor**, interview and project evaluation are rule-based, not LLM-driven. Project evaluation is static analysis of repository evidence — the code is never executed — and is not a human code review.
- Generated sections of each project (tasks, checklists, diagrams, schemas) are template-driven from curated seeds, not individually hand-written.
- Deployment URLs are only checked for browser reachability; screenshots and demo videos are accepted as links/text and are not analysed. Evidence-only submissions can never reach "verified".
- In demo mode, verification state lives in browser storage and can be edited by the user. Only full (backend) mode is tamper-resistant.
- Projects marked complete in earlier versions are shown as legacy self-reported and no longer count as verified evidence.

---

## 6. Security notes
- Change `JWT_SECRET` and the default database/pgAdmin passwords before any real deployment.
- Passwords are hashed with bcrypt; login attempts are rate-limited; JSON bodies are size-limited.
- The server serves only `index.html` and `vendor/` (never the backend folder).
- Do not expose PostgreSQL (5432) or pgAdmin (5050) publicly.

## 7. Roadmap ideas
LLM-backed mentor and interviewer, OAuth login with GitHub (private-repo analysis), file upload for screenshots/videos, human reviewer workflow for projects, richer resume parsing.
