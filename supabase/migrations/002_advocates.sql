-- Advocates (team members) table
CREATE TABLE advocates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'advocate'
                CHECK (role IN ('senior_advocate', 'advocate', 'junior', 'paralegal')),
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add assigned_to columns
ALTER TABLE cases ADD COLUMN assigned_to UUID REFERENCES advocates(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES advocates(id) ON DELETE SET NULL;

CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- RLS
ALTER TABLE advocates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON advocates FOR ALL USING (true);
