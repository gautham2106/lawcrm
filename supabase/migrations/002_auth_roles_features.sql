-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('admin', 'staff')),
  advocate_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON profiles FOR ALL USING (true);

-- Auto-create profile when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, advocate_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NEW.raw_user_meta_data->>'advocate_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- FIRM SETTINGS (case stages, document tags)
-- ─────────────────────────────────────────────
CREATE TABLE firm_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER firm_settings_updated_at
  BEFORE UPDATE ON firm_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE firm_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON firm_settings FOR ALL USING (true);

INSERT INTO firm_settings (key, value) VALUES
  ('case_stages',    '["Intake","Filed","Notice Issued","Evidence","Arguments","Judgment Reserved","Disposed","Closed"]'),
  ('document_tags',  '["Petition","Affidavit","Order","Vakalatnama","Evidence","Bail Order","Notice","Reply"]'),
  ('advocates',      '[]');

-- ─────────────────────────────────────────────
-- CASE NOTES (strategy, instructions, observations)
-- ─────────────────────────────────────────────
CREATE TABLE case_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  author_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER case_notes_updated_at
  BEFORE UPDATE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON case_notes FOR ALL USING (true);

CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);

-- ─────────────────────────────────────────────
-- CASE DOCUMENTS
-- ─────────────────────────────────────────────
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

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON case_documents FOR ALL USING (true);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);

-- ─────────────────────────────────────────────
-- DOCUMENT ANNOTATIONS (page bookmarks)
-- ─────────────────────────────────────────────
CREATE TABLE document_annotations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES case_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON document_annotations FOR ALL USING (true);

CREATE INDEX idx_doc_annotations_doc_id ON document_annotations(document_id);

-- ─────────────────────────────────────────────
-- ALTER CASES — add stage + advocate_name
-- ─────────────────────────────────────────────
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS stage         TEXT DEFAULT 'Intake',
  ADD COLUMN IF NOT EXISTS advocate_name TEXT;

CREATE INDEX IF NOT EXISTS idx_cases_stage     ON cases(stage);
CREATE INDEX IF NOT EXISTS idx_cases_advocate  ON cases(advocate_name);

-- ─────────────────────────────────────────────
-- ALTER TASKS — add task_type, meeting fields, advocate_name
-- ─────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type        TEXT NOT NULL DEFAULT 'task'
                             CHECK (task_type IN ('task', 'meeting')),
  ADD COLUMN IF NOT EXISTS meeting_location TEXT,
  ADD COLUMN IF NOT EXISTS meeting_with     TEXT,
  ADD COLUMN IF NOT EXISTS advocate_name   TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_advocate ON tasks(advocate_name);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET (run in Supabase dashboard if using Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false);
-- CREATE POLICY "allow_all" ON storage.objects FOR ALL USING (bucket_id = 'case-documents');
-- ─────────────────────────────────────────────
