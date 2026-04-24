-- ─────────────────────────────────────────────
-- FIRMS
-- ─────────────────────────────────────────────
CREATE TABLE firms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON firms FOR ALL USING (true);

CREATE INDEX idx_firms_name ON firms(name);

-- Default firm for existing data
INSERT INTO firms (id, name) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Default Firm');

-- ─────────────────────────────────────────────
-- ADD firm_id TO PROFILES + super admin flag
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS firm_id        UUID REFERENCES firms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_firm_id ON profiles(firm_id);

-- ─────────────────────────────────────────────
-- ADD firm_id TO CLIENTS
-- ─────────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE clients SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_firm_id ON clients(firm_id);

-- ─────────────────────────────────────────────
-- ADD firm_id TO CASES
-- ─────────────────────────────────────────────
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE cases SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_firm_id ON cases(firm_id);

-- ─────────────────────────────────────────────
-- ADD firm_id TO TASKS (can be standalone, not always via case)
-- ─────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE tasks SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_firm_id ON tasks(firm_id);

-- ─────────────────────────────────────────────
-- ADD firm_id TO NOTIFICATIONS
-- ─────────────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE notifications SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_firm_id ON notifications(firm_id);

-- ─────────────────────────────────────────────
-- UPDATE firm_settings TO BE PER-FIRM
-- ─────────────────────────────────────────────
ALTER TABLE firm_settings
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE firm_settings SET firm_id = 'f1000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

-- Replace global unique key with per-firm unique key
ALTER TABLE firm_settings DROP CONSTRAINT IF EXISTS firm_settings_key_key;
ALTER TABLE firm_settings
  ADD CONSTRAINT firm_settings_firm_key UNIQUE (firm_id, key);

CREATE INDEX IF NOT EXISTS idx_firm_settings_firm_id ON firm_settings(firm_id);

-- ─────────────────────────────────────────────
-- UPDATE handle_new_user TO SET firm_id FROM INVITE METADATA
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, advocate_name, firm_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NEW.raw_user_meta_data->>'advocate_name',
    (NEW.raw_user_meta_data->>'firm_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
