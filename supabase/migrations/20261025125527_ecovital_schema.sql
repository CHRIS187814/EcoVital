/*
# EcoVital - Health Risk Platform Schema

1. New Tables
- `health_profile`: stores the single user's health profile (age, sex, location, conditions, family history). Single-tenant demo app, no auth.
- `daily_logs`: daily tracking entries (sleep, steps, food, symptoms, date).
- `risk_scores`: computed risk score history with factor breakdown and recommendations (score, aqi, factors JSON, recommendations JSON, scored_at).

2. Security
- Enable RLS on all tables.
- Grant CRUD to anon + authenticated (no-auth single-tenant demo; data is intentionally shared).
- Policies allow all CRUD for anon + authenticated (public/shared demo data).
*/

CREATE TABLE IF NOT EXISTS health_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'User',
  age integer NOT NULL DEFAULT 30,
  sex text NOT NULL DEFAULT 'other',
  city text NOT NULL DEFAULT 'Delhi',
  lat double precision NOT NULL DEFAULT 28.6692,
  lon double precision NOT NULL DEFAULT 77.4538,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  family_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_profile ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_profile TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_profile" ON health_profile;
CREATE POLICY "anon_all_profile" ON health_profile FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_profile" ON health_profile FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_profile" ON health_profile FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_profile" ON health_profile FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours double precision,
  steps integer,
  food_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  reported_symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_logs TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_logs" ON daily_logs;
CREATE POLICY "anon_all_logs" ON daily_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_logs" ON daily_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_logs" ON daily_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_logs" ON daily_logs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scored_at timestamptz NOT NULL DEFAULT now(),
  risk_score double precision NOT NULL,
  aqi double precision,
  dominant_pollutant text,
  factor_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  previous_score double precision
);

ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON risk_scores TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_scores" ON risk_scores;
CREATE POLICY "anon_all_scores" ON risk_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_scores" ON risk_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_scores" ON risk_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_scores" ON risk_scores FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_time ON risk_scores(scored_at DESC);
