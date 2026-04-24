-- ─────────────────────────────────────────────
-- 004: firm_id on hearings/fees/transactions + composite indexes
-- ─────────────────────────────────────────────

-- Fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── firm_id → hearings ───────────────────────────────────────────────
ALTER TABLE hearings ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;
UPDATE hearings h SET firm_id = c.firm_id FROM cases c WHERE h.case_id = c.id AND h.firm_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_hearings_firm_id   ON hearings(firm_id);
CREATE INDEX IF NOT EXISTS idx_hearings_firm_date ON hearings(firm_id, date);

CREATE OR REPLACE FUNCTION fill_hearing_firm_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.firm_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT firm_id INTO NEW.firm_id FROM cases WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hearing_auto_firm_id ON hearings;
CREATE TRIGGER hearing_auto_firm_id
  BEFORE INSERT ON hearings FOR EACH ROW EXECUTE FUNCTION fill_hearing_firm_id();

-- ── firm_id → fees ───────────────────────────────────────────────────
ALTER TABLE fees ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;
UPDATE fees f SET firm_id = c.firm_id FROM cases c WHERE f.case_id = c.id AND f.firm_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_fees_firm_id       ON fees(firm_id);
CREATE INDEX IF NOT EXISTS idx_fees_firm_expected ON fees(firm_id, expected_by NULLS LAST);

CREATE OR REPLACE FUNCTION fill_fee_firm_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.firm_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT firm_id INTO NEW.firm_id FROM cases WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS fee_auto_firm_id ON fees;
CREATE TRIGGER fee_auto_firm_id
  BEFORE INSERT ON fees FOR EACH ROW EXECUTE FUNCTION fill_fee_firm_id();

-- ── firm_id → transactions ───────────────────────────────────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;
UPDATE transactions t SET firm_id = c.firm_id FROM cases c WHERE t.case_id = c.id AND t.firm_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_firm_id ON transactions(firm_id);

CREATE OR REPLACE FUNCTION fill_transaction_firm_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.firm_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT firm_id INTO NEW.firm_id FROM cases WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS transaction_auto_firm_id ON transactions;
CREATE TRIGGER transaction_auto_firm_id
  BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION fill_transaction_firm_id();

-- ── Composite indexes for common list queries ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_cases_firm_status   ON cases(firm_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_firm_stage    ON cases(firm_id, stage);
CREATE INDEX IF NOT EXISTS idx_cases_firm_advocate ON cases(firm_id, advocate_name);
CREATE INDEX IF NOT EXISTS idx_cases_firm_created  ON cases(firm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_firm_done_due ON tasks(firm_id, done, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_firm_advocate ON tasks(firm_id, advocate_name);
CREATE INDEX IF NOT EXISTS idx_notif_firm_unread   ON notifications(firm_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_firm_name   ON clients(firm_id, name);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_ts  ON case_notes(case_id, created_at DESC);

-- ── Trigram indexes for fast ILIKE search ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cases_trgm_name   ON cases   USING gin(case_name    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cases_trgm_number ON cases   USING gin(case_number  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cases_trgm_court  ON cases   USING gin(coalesce(court, '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_trgm_name ON clients USING gin(name         gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_trgm_phone ON clients USING gin(coalesce(phone,'') gin_trgm_ops);

-- ── firms table: add logo_url ─────────────────────────────────────────
ALTER TABLE firms ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ── Update seed data firm_id on hearings/fees/transactions ───────────
-- (handled by the UPDATE statements above)
