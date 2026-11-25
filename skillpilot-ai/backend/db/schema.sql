-- SkillPilot AI — PostgreSQL schema. Applied automatically on API start (idempotent).
-- Open pgAdmin to browse these tables.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL DEFAULT '',
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS profiles (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  education       TEXT NOT NULL DEFAULT '',
  branch          TEXT NOT NULL DEFAULT '',
  grad_year       TEXT NOT NULL DEFAULT '',
  experience      TEXT NOT NULL DEFAULT '',
  career_id       TEXT NOT NULL DEFAULT '',
  github_username TEXT NOT NULL DEFAULT '',
  resume_text     TEXT NOT NULL DEFAULT '',
  preferred_tech  JSONB NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per skill the user selected in onboarding Step 3 (canonical id from the skill catalogue).
CREATE TABLE IF NOT EXISTS user_skills (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT    NOT NULL,
  name     TEXT    NOT NULL,
  category TEXT    NOT NULL DEFAULT 'other',
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_id)
);

-- Evidence + progress documents: githubData, resumeData, assessmentResults, interviewResult, completedProjects
CREATE TABLE IF NOT EXISTS user_state (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key        TEXT    NOT NULL,
  value      JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Career Role Explorer: level, secondary interests and recently viewed careers (added in v3; safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_level      TEXT  NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_careers JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recent_careers    JSONB NOT NULL DEFAULT '[]';

-- Dynamic career assessments (v4): admin-editable settings + every attempt with server-held questions/answers.
CREATE TABLE IF NOT EXISTS assessment_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id       TEXT NOT NULL,
  career_id      TEXT NOT NULL DEFAULT '',
  level          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'in_progress',   -- in_progress | submitted | expired
  questions      JSONB NOT NULL,                        -- full questions INCLUDING correct answers (never sent before submit)
  answers        JSONB NOT NULL DEFAULT '{}',
  result         JSONB,
  settings       JSONB NOT NULL DEFAULT '{}',
  time_limit_sec INTEGER NOT NULL DEFAULT 900,
  pct            INTEGER,
  passed         BOOLEAN,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS assessment_attempts_user_skill ON assessment_attempts (user_id, skill_id, level);

-- Proof-of-skill project submissions: one row per submission attempt (resubmission allowed).
CREATE TABLE IF NOT EXISTS project_submissions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id  TEXT NOT NULL,
  attempt     INTEGER NOT NULL DEFAULT 1,
  repo_url    TEXT NOT NULL DEFAULT '',
  mode        TEXT NOT NULL DEFAULT 'repository',     -- repository | evidence-only
  status      TEXT NOT NULL DEFAULT 'submitted',      -- submitted | verified   (verified only via server-side repository analysis)
  overall     INTEGER NOT NULL DEFAULT 0,
  evaluation  JSONB NOT NULL,
  submission  JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_submissions_user_project ON project_submissions (user_id, project_id, attempt);
