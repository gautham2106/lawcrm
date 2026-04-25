-- ─────────────────────────────────────────────
-- FIRMS  (law firm tenants)
-- ─────────────────────────────────────────────
CREATE TABLE firms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SUPER ADMINS  (platform-level, not firm-level)
-- ─────────────────────────────────────────────
CREATE TABLE super_admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link advocates to their firm
ALTER TABLE advocates ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_advocates_firm_id   ON advocates(firm_id);
CREATE INDEX idx_super_admins_auth   ON super_admins(auth_user_id);

-- RLS
ALTER TABLE firms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated" ON firms        FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON super_admins FOR ALL USING (true);
