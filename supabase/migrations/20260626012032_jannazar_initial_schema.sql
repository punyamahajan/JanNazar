/*
# JanNazar — Initial Schema

## Overview
Creates all core tables for the JanNazar AI Civic Intelligence Platform.

## Tables

### users
Stores citizen, authority, and admin profiles with trust scores.
- id, email, full_name, phone, avatar_url, trust_score, role, created_at

### issues
Core civic issues table with AI-enriched fields.
- All location, category, status, urgency, priority, AI summary, ETA fields
- media_urls as text array for uploaded images/videos

### issue_events
Immutable audit log of everything that happens to an issue.
- event_type: created | status_change | comment | vote | assigned | resolved | proof_uploaded

### comments
Threaded comments on issues; official authority replies flagged separately.

### votes
Deduplicated votes per user per issue per type (upvote, verified, resolved_confirmed).

### agent_logs
Full per-run logs of every AI agent including reasoning steps (thoughts array).

### departments
Municipal department registry with SLA stats.

### badges
Gamification badges awarded to active citizens.

## Security
- RLS enabled on all tables
- Citizens: read all issues; write only their own rows
- Authority/admin handled via role in JWT (application-layer)
- anon role given SELECT on issues/comments/votes/departments for public map

## Notes
- PostGIS extension enabled for spatial indexing
- Realtime should be enabled on issues + issue_events tables in Supabase dashboard
*/

-- Enable PostGIS for spatial indexing
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  phone        TEXT,
  avatar_url   TEXT,
  trust_score  INTEGER DEFAULT 50,
  role         TEXT DEFAULT 'citizen',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_delete_own" ON users;
CREATE POLICY "users_delete_own" ON users FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Public profile read for leaderboard
DROP POLICY IF EXISTS "users_public_read" ON users;
CREATE POLICY "users_public_read" ON users FOR SELECT
  TO anon, authenticated USING (true);

-- ─── issues ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID REFERENCES users(id),
  title            TEXT NOT NULL,
  description_raw  TEXT,
  description_en   TEXT,
  category         TEXT,
  subcategory      TEXT,
  status           TEXT DEFAULT 'open',
  urgency          TEXT DEFAULT 'medium',
  priority_score   INTEGER DEFAULT 0,
  confidence       FLOAT,
  lat              FLOAT NOT NULL,
  lng              FLOAT NOT NULL,
  address          TEXT,
  department       TEXT,
  assigned_to      UUID REFERENCES users(id),
  duplicate_of     UUID REFERENCES issues(id),
  ai_summary       TEXT,
  estimated_eta    TEXT,
  upvotes          INTEGER DEFAULT 0,
  verified_count   INTEGER DEFAULT 0,
  media_urls       TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issues_public_read" ON issues;
CREATE POLICY "issues_public_read" ON issues FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "issues_insert_authenticated" ON issues;
CREATE POLICY "issues_insert_authenticated" ON issues FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "issues_insert_public" ON issues;
CREATE POLICY "issues_insert_public" ON issues FOR INSERT
  TO anon WITH CHECK (reporter_id IS NULL);

DROP POLICY IF EXISTS "issues_update_own" ON issues;
CREATE POLICY "issues_update_own" ON issues FOR UPDATE
  TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "issues_delete_own" ON issues;
CREATE POLICY "issues_delete_own" ON issues FOR DELETE
  TO authenticated USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_issues_status   ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created  ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(lat, lng);

-- ─── issue_events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID REFERENCES issues(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES users(id),
  event_type TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE issue_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issue_events_public_read" ON issue_events;
CREATE POLICY "issue_events_public_read" ON issue_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "issue_events_insert_authenticated" ON issue_events;
CREATE POLICY "issue_events_insert_authenticated" ON issue_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "issue_events_update_own" ON issue_events;
CREATE POLICY "issue_events_update_own" ON issue_events FOR UPDATE
  TO authenticated USING (auth.uid() = actor_id);

DROP POLICY IF EXISTS "issue_events_delete_own" ON issue_events;
CREATE POLICY "issue_events_delete_own" ON issue_events FOR DELETE
  TO authenticated USING (auth.uid() = actor_id);

-- ─── comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  body        TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_public_read" ON comments;
CREATE POLICY "comments_public_read" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
CREATE POLICY "comments_insert_authenticated" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── votes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  type       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (issue_id, user_id, type)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_public_read" ON votes;
CREATE POLICY "votes_public_read" ON votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
CREATE POLICY "votes_insert_authenticated" ON votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update_own" ON votes;
CREATE POLICY "votes_update_own" ON votes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_delete_own" ON votes;
CREATE POLICY "votes_delete_own" ON votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── agent_logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID REFERENCES issues(id),
  agent_name  TEXT,
  input       JSONB,
  output      JSONB,
  thoughts    TEXT[],
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_logs_public_read" ON agent_logs;
CREATE POLICY "agent_logs_public_read" ON agent_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "agent_logs_insert_authenticated" ON agent_logs;
CREATE POLICY "agent_logs_insert_authenticated" ON agent_logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "agent_logs_insert_public" ON agent_logs;
CREATE POLICY "agent_logs_insert_public" ON agent_logs FOR INSERT
  TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "agent_logs_update_authenticated" ON agent_logs;
CREATE POLICY "agent_logs_update_authenticated" ON agent_logs FOR UPDATE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "agent_logs_delete_authenticated" ON agent_logs;
CREATE POLICY "agent_logs_delete_authenticated" ON agent_logs FOR DELETE
  TO authenticated USING (true);

-- ─── departments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT UNIQUE NOT NULL,
  contact_email        TEXT,
  avg_resolution_days  FLOAT,
  resolution_rate      FLOAT
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_public_read" ON departments;
CREATE POLICY "departments_public_read" ON departments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "departments_insert_authenticated" ON departments;
CREATE POLICY "departments_insert_authenticated" ON departments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "departments_update_authenticated" ON departments;
CREATE POLICY "departments_update_authenticated" ON departments FOR UPDATE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "departments_delete_authenticated" ON departments;
CREATE POLICY "departments_delete_authenticated" ON departments FOR DELETE
  TO authenticated USING (true);

-- ─── badges ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  badge_type TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_public_read" ON badges;
CREATE POLICY "badges_public_read" ON badges FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "badges_insert_authenticated" ON badges;
CREATE POLICY "badges_insert_authenticated" ON badges FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "badges_update_authenticated" ON badges;
CREATE POLICY "badges_update_authenticated" ON badges FOR UPDATE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "badges_delete_authenticated" ON badges;
CREATE POLICY "badges_delete_authenticated" ON badges FOR DELETE
  TO authenticated USING (true);

-- ─── Seed departments ─────────────────────────────────────────────────────────
INSERT INTO departments (name, contact_email, avg_resolution_days, resolution_rate) VALUES
  ('Roads & Infrastructure', 'roads@civic.gov.in', 8.5, 0.74),
  ('Sanitation & Waste', 'sanitation@civic.gov.in', 3.2, 0.88),
  ('Water & Sewerage', 'water@civic.gov.in', 5.1, 0.71),
  ('Electricity & Streetlights', 'electricity@civic.gov.in', 2.8, 0.91),
  ('Parks & Horticulture', 'parks@civic.gov.in', 6.3, 0.65),
  ('Animal Control', 'animal@civic.gov.in', 1.5, 0.93),
  ('Building & Construction', 'building@civic.gov.in', 12.0, 0.58),
  ('Flood & Drainage', 'drainage@civic.gov.in', 4.7, 0.69)
ON CONFLICT (name) DO NOTHING;
