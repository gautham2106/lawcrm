-- CaseBook Law Firm CRM - Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CASES
-- ─────────────────────────────────────────────
CREATE TABLE cases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number  TEXT UNIQUE NOT NULL,
  case_name    TEXT NOT NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'closed', 'pending', 'won', 'lost')),
  court        TEXT,
  judge        TEXT,
  filing_date  DATE,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- HEARINGS
-- ─────────────────────────────────────────────
CREATE TABLE hearings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time        TIME,
  court       TEXT,
  purpose     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID REFERENCES cases(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  due_date    DATE,
  priority    TEXT DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FEES
-- ─────────────────────────────────────────────
CREATE TABLE fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  agreed_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_by     DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRANSACTIONS (payments / charges)
-- ─────────────────────────────────────────────
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  fee_id      UUID REFERENCES fees(id) ON DELETE SET NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  type        TEXT NOT NULL DEFAULT 'payment'
                CHECK (type IN ('payment', 'fee', 'expense', 'refund')),
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  message     TEXT,
  type        TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info', 'hearing', 'payment', 'task', 'alert')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  case_id     UUID REFERENCES cases(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER FUNCTION
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fees_updated_at
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_cases_client_id     ON cases(client_id);
CREATE INDEX idx_cases_status        ON cases(status);
CREATE INDEX idx_hearings_case_id    ON hearings(case_id);
CREATE INDEX idx_hearings_date       ON hearings(date);
CREATE INDEX idx_tasks_case_id       ON tasks(case_id);
CREATE INDEX idx_tasks_done          ON tasks(done);
CREATE INDEX idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX idx_fees_case_id        ON fees(case_id);
CREATE INDEX idx_transactions_case_id ON transactions(case_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY (enable, but allow all for now — add auth policies later)
-- ─────────────────────────────────────────────
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated users (tighten when auth is wired up)
CREATE POLICY "allow_all_authenticated" ON clients       FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON cases         FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON hearings      FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON tasks         FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON fees          FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON transactions  FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON notifications FOR ALL USING (true);

-- ─────────────────────────────────────────────
-- SEED DATA (sample records matching the original CaseBook HTML app)
-- ─────────────────────────────────────────────
INSERT INTO clients (id, name, phone, email, address) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ravi Sharma',    '+91 98765 43210', 'ravi.sharma@email.com',    '12 MG Road, Bengaluru'),
  ('a1000000-0000-0000-0000-000000000002', 'Priya Mehta',    '+91 87654 32109', 'priya.mehta@email.com',    '45 Park Street, Mumbai'),
  ('a1000000-0000-0000-0000-000000000003', 'Suresh Kumar',   '+91 76543 21098', 'suresh.kumar@email.com',   '8 Civil Lines, Delhi'),
  ('a1000000-0000-0000-0000-000000000004', 'Anita Verma',    '+91 65432 10987', 'anita.verma@email.com',    '23 Lake View, Hyderabad'),
  ('a1000000-0000-0000-0000-000000000005', 'Mohan Das',      '+91 54321 09876', 'mohan.das@email.com',      '7 Ring Road, Chennai');

INSERT INTO cases (id, case_number, case_name, client_id, status, court, judge, filing_date, description) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'CAS-2024-001', 'Sharma vs State',          'a1000000-0000-0000-0000-000000000001', 'active',  'High Court, Bengaluru',  'Hon. Justice Reddy',   '2024-01-15', 'Property dispute case'),
  ('b1000000-0000-0000-0000-000000000002', 'CAS-2024-002', 'Mehta Divorce Petition',   'a1000000-0000-0000-0000-000000000002', 'pending', 'Family Court, Mumbai',   'Hon. Justice Kulkarni','2024-02-20', 'Matrimonial case'),
  ('b1000000-0000-0000-0000-000000000003', 'CAS-2024-003', 'Kumar Land Acquisition',   'a1000000-0000-0000-0000-000000000003', 'active',  'District Court, Delhi',  'Hon. Justice Singh',   '2024-03-10', 'Land acquisition dispute'),
  ('b1000000-0000-0000-0000-000000000004', 'CAS-2024-004', 'Verma Employment Matter',  'a1000000-0000-0000-0000-000000000004', 'closed',  'Labour Court, Hyderabad','Hon. Justice Rao',     '2024-01-05', 'Wrongful termination'),
  ('b1000000-0000-0000-0000-000000000005', 'CAS-2024-005', 'Das Consumer Complaint',   'a1000000-0000-0000-0000-000000000005', 'active',  'Consumer Court, Chennai','Hon. Justice Iyer',    '2024-04-01', 'Consumer protection case');

INSERT INTO hearings (case_id, date, time, court, purpose) VALUES
  ('b1000000-0000-0000-0000-000000000001', CURRENT_DATE,       '10:30', 'High Court, Bengaluru',   'Evidence Submission'),
  ('b1000000-0000-0000-0000-000000000001', CURRENT_DATE + 14,  '11:00', 'High Court, Bengaluru',   'Arguments'),
  ('b1000000-0000-0000-0000-000000000002', CURRENT_DATE + 3,   '09:30', 'Family Court, Mumbai',    'Mediation'),
  ('b1000000-0000-0000-0000-000000000003', CURRENT_DATE + 7,   '14:00', 'District Court, Delhi',   'Cross Examination'),
  ('b1000000-0000-0000-0000-000000000005', CURRENT_DATE + 1,   '10:00', 'Consumer Court, Chennai', 'First Hearing');

INSERT INTO tasks (case_id, title, done, due_date, priority) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'File evidence documents',        false, CURRENT_DATE,       'high'),
  ('b1000000-0000-0000-0000-000000000001', 'Prepare witness statements',     false, CURRENT_DATE + 5,   'high'),
  ('b1000000-0000-0000-0000-000000000002', 'Collect financial documents',    false, CURRENT_DATE + 2,   'medium'),
  ('b1000000-0000-0000-0000-000000000003', 'Review land records',            true,  CURRENT_DATE - 3,   'medium'),
  ('b1000000-0000-0000-0000-000000000005', 'Draft complaint letter',         true,  CURRENT_DATE - 7,   'low'),
  (NULL,                                   'Renew Bar Council membership',   false, CURRENT_DATE + 10,  'high');

INSERT INTO fees (case_id, agreed_amount, paid_amount, expected_by) VALUES
  ('b1000000-0000-0000-0000-000000000001', 150000.00, 75000.00,  CURRENT_DATE + 30),
  ('b1000000-0000-0000-0000-000000000002', 80000.00,  80000.00,  NULL),
  ('b1000000-0000-0000-0000-000000000003', 120000.00, 40000.00,  CURRENT_DATE + 15),
  ('b1000000-0000-0000-0000-000000000004', 60000.00,  60000.00,  NULL),
  ('b1000000-0000-0000-0000-000000000005', 45000.00,  10000.00,  CURRENT_DATE + 20);

INSERT INTO transactions (case_id, amount, type, description, date) VALUES
  ('b1000000-0000-0000-0000-000000000001', 50000.00, 'payment', 'Advance payment',         CURRENT_DATE - 60),
  ('b1000000-0000-0000-0000-000000000001', 25000.00, 'payment', 'Second installment',      CURRENT_DATE - 30),
  ('b1000000-0000-0000-0000-000000000002', 80000.00, 'payment', 'Full payment received',   CURRENT_DATE - 45),
  ('b1000000-0000-0000-0000-000000000003', 40000.00, 'payment', 'Initial retainer',        CURRENT_DATE - 20),
  ('b1000000-0000-0000-0000-000000000005', 10000.00, 'payment', 'Registration fee',        CURRENT_DATE - 5);

INSERT INTO notifications (title, message, type, is_read, case_id) VALUES
  ('Hearing Today',         'Sharma vs State — Evidence Submission at 10:30 AM',  'hearing', false, 'b1000000-0000-0000-0000-000000000001'),
  ('Payment Received',      'Sharma vs State — ₹25,000 received',                 'payment', true,  'b1000000-0000-0000-0000-000000000001'),
  ('Upcoming Hearing',      'Mediation hearing for Mehta case in 3 days',         'hearing', false, 'b1000000-0000-0000-0000-000000000002'),
  ('Task Due Today',        'File evidence documents for Sharma vs State',        'task',    false, 'b1000000-0000-0000-0000-000000000001'),
  ('Fee Reminder',          'Das Consumer Complaint — ₹35,000 outstanding',       'payment', false, 'b1000000-0000-0000-0000-000000000005');
