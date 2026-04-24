-- ═══════════════════════════════════════════════════════════════════
-- CaseBook Law Firm CRM — Complete Schema
-- Run this on a fresh Supabase project for a clean setup.
-- Consolidates migrations 001–004.
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────────────────────────────
-- FIRMS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE firms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  logo_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  advocate_name TEXT,
  firm_id       UUID REFERENCES firms(id) ON DELETE SET NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- CASES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE cases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id       UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_number   TEXT NOT NULL,
  case_name     TEXT NOT NULL,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'closed', 'pending', 'won', 'lost')),
  stage         TEXT DEFAULT 'Intake',
  advocate_name TEXT,
  court         TEXT,
  judge         TEXT,
  filing_date   DATE,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (firm_id, case_number)
);

-- ─────────────────────────────────────────────────────────────────────
-- HEARINGS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE hearings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID REFERENCES firms(id) ON DELETE CASCADE,
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  time       TIME,
  court      TEXT,
  purpose    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id          UUID REFERENCES firms(id) ON DELETE CASCADE,
  case_id          UUID REFERENCES cases(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  done             BOOLEAN NOT NULL DEFAULT FALSE,
  due_date         DATE,
  priority         TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  task_type        TEXT NOT NULL DEFAULT 'task' CHECK (task_type IN ('task', 'meeting')),
  meeting_location TEXT,
  meeting_with     TEXT,
  advocate_name    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- FEES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE fees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id        UUID REFERENCES firms(id) ON DELETE CASCADE,
  case_id        UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  agreed_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_by    DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID REFERENCES firms(id) ON DELETE CASCADE,
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  fee_id      UUID REFERENCES fees(id) ON DELETE SET NULL,
  amount      NUMERIC(12,2) NOT NULL,
  type        TEXT NOT NULL DEFAULT 'payment'
                CHECK (type IN ('payment', 'fee', 'expense', 'refund')),
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID REFERENCES firms(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT,
  type       TEXT NOT NULL DEFAULT 'info'
               CHECK (type IN ('info', 'hearing', 'payment', 'task', 'alert')),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  case_id    UUID REFERENCES cases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- FIRM SETTINGS (per-firm pipeline stages, document tags, advocates)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE firm_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (firm_id, key)
);

-- ─────────────────────────────────────────────────────────────────────
-- CASE NOTES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE case_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  author_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- CASE DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE case_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  storage_path TEXT,
  url          TEXT,
  tag          TEXT,
  notes        TEXT,
  file_size    BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- DOCUMENT ANNOTATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE document_annotations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES case_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER firms_updated_at        BEFORE UPDATE ON firms        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at      BEFORE UPDATE ON clients      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cases_updated_at        BEFORE UPDATE ON cases        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at        BEFORE UPDATE ON tasks        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fees_updated_at         BEFORE UPDATE ON fees         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER firm_settings_updated_at BEFORE UPDATE ON firm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER case_notes_updated_at   BEFORE UPDATE ON case_notes   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- AUTO-FILL firm_id FROM PARENT CASE
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fill_firm_from_case() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.firm_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT firm_id INTO NEW.firm_id FROM cases WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hearing_auto_firm_id     BEFORE INSERT ON hearings     FOR EACH ROW EXECUTE FUNCTION fill_firm_from_case();
CREATE TRIGGER fee_auto_firm_id         BEFORE INSERT ON fees         FOR EACH ROW EXECUTE FUNCTION fill_firm_from_case();
CREATE TRIGGER transaction_auto_firm_id BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION fill_firm_from_case();

-- ─────────────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY (permissive — firm isolation enforced in app layer)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE firms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees                ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON firms               FOR ALL USING (true);
CREATE POLICY "allow_all" ON profiles            FOR ALL USING (true);
CREATE POLICY "allow_all" ON clients             FOR ALL USING (true);
CREATE POLICY "allow_all" ON cases               FOR ALL USING (true);
CREATE POLICY "allow_all" ON hearings            FOR ALL USING (true);
CREATE POLICY "allow_all" ON tasks               FOR ALL USING (true);
CREATE POLICY "allow_all" ON fees                FOR ALL USING (true);
CREATE POLICY "allow_all" ON transactions        FOR ALL USING (true);
CREATE POLICY "allow_all" ON notifications       FOR ALL USING (true);
CREATE POLICY "allow_all" ON firm_settings       FOR ALL USING (true);
CREATE POLICY "allow_all" ON case_notes          FOR ALL USING (true);
CREATE POLICY "allow_all" ON case_documents      FOR ALL USING (true);
CREATE POLICY "allow_all" ON document_annotations FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────

-- Single-column
CREATE INDEX idx_profiles_firm_id      ON profiles(firm_id);
CREATE INDEX idx_clients_firm_id       ON clients(firm_id);
CREATE INDEX idx_cases_firm_id         ON cases(firm_id);
CREATE INDEX idx_cases_client_id       ON cases(client_id);
CREATE INDEX idx_hearings_case_id      ON hearings(case_id);
CREATE INDEX idx_hearings_firm_id      ON hearings(firm_id);
CREATE INDEX idx_tasks_firm_id         ON tasks(firm_id);
CREATE INDEX idx_tasks_case_id         ON tasks(case_id);
CREATE INDEX idx_fees_firm_id          ON fees(firm_id);
CREATE INDEX idx_fees_case_id          ON fees(case_id);
CREATE INDEX idx_transactions_firm_id  ON transactions(firm_id);
CREATE INDEX idx_transactions_case_id  ON transactions(case_id);
CREATE INDEX idx_notifications_firm_id ON notifications(firm_id);
CREATE INDEX idx_firm_settings_firm_id ON firm_settings(firm_id);
CREATE INDEX idx_case_notes_case_id    ON case_notes(case_id);
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_doc_annotations_doc_id ON document_annotations(document_id);

-- Composite (for list pages with firm scoping + filters)
CREATE INDEX idx_cases_firm_status    ON cases(firm_id, status);
CREATE INDEX idx_cases_firm_stage     ON cases(firm_id, stage);
CREATE INDEX idx_cases_firm_advocate  ON cases(firm_id, advocate_name);
CREATE INDEX idx_cases_firm_created   ON cases(firm_id, created_at DESC);
CREATE INDEX idx_hearings_firm_date   ON hearings(firm_id, date);
CREATE INDEX idx_fees_firm_expected   ON fees(firm_id, expected_by NULLS LAST);
CREATE INDEX idx_tasks_firm_done_due  ON tasks(firm_id, done, due_date);
CREATE INDEX idx_tasks_firm_advocate  ON tasks(firm_id, advocate_name);
CREATE INDEX idx_notif_firm_unread    ON notifications(firm_id, is_read, created_at DESC);
CREATE INDEX idx_clients_firm_name    ON clients(firm_id, name);
CREATE INDEX idx_case_notes_case_ts   ON case_notes(case_id, created_at DESC);

-- Trigram (fast ILIKE / fuzzy search)
CREATE INDEX idx_cases_trgm_name    ON cases   USING gin(case_name   gin_trgm_ops);
CREATE INDEX idx_cases_trgm_number  ON cases   USING gin(case_number gin_trgm_ops);
CREATE INDEX idx_cases_trgm_court   ON cases   USING gin(coalesce(court,'') gin_trgm_ops);
CREATE INDEX idx_clients_trgm_name  ON clients USING gin(name        gin_trgm_ops);
CREATE INDEX idx_clients_trgm_phone ON clients USING gin(coalesce(phone,'') gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false);
-- CREATE POLICY "allow_all" ON storage.objects FOR ALL USING (bucket_id = 'case-documents');
-- ─────────────────────────────────────────────────────────────────────
