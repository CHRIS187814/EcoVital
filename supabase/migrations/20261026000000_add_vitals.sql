/*
# Add vitals to daily_logs

New optional columns: blood pressure (systolic/diastolic), fasting blood sugar (mg/dL), anxiety level (1-10).
Safe to run on a database that already has the first EcoVital migration.
*/

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS bp_systolic integer;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS bp_diastolic integer;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS blood_sugar double precision;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS anxiety_level integer;
