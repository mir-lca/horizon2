-- Migration 005: Soft-delete for resources (req 2.1.2)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
