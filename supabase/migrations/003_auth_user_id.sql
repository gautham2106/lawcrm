-- Link advocates to Supabase auth users
ALTER TABLE advocates ADD COLUMN auth_user_id UUID UNIQUE;
CREATE INDEX idx_advocates_auth_user_id ON advocates(auth_user_id);
