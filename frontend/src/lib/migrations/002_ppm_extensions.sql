-- PPM extensions migration 002
-- Run after 001_initial_schema.sql

-- Project hierarchy workstreams
CREATE TABLE IF NOT EXISTS workstreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kanban / agile tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  workstream_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  story_points INTEGER,
  assignee TEXT,
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skills catalogue
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS resource_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'intermediate',
  project_id UUID,
  valid_from DATE,
  valid_to DATE
);

-- Configurable labour rates
CREATE TABLE IF NOT EXISTS labour_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  seniority_level TEXT NOT NULL,
  role_category TEXT,
  rate_per_hour NUMERIC,
  currency TEXT DEFAULT 'USD',
  effective_date DATE NOT NULL
);

-- Spend records (NRE / Capital / Labor with PO)
CREATE TABLE IF NOT EXISTS spend_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  record_date DATE NOT NULL,
  po_number TEXT,
  so_number TEXT,
  vendor TEXT,
  is_actual BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Capital asset sub-items
CREATE TABLE IF NOT EXISTS capital_asset_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC,
  acquired_date DATE,
  serial_number TEXT
);

-- Equipment on loan
CREATE TABLE IF NOT EXISTS equipment_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  loaned_to TEXT NOT NULL,
  loaned_at DATE NOT NULL,
  return_by DATE,
  returned_at DATE,
  notes TEXT
);

-- Governance stage definitions
CREATE TABLE IF NOT EXISTS governance_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  description TEXT,
  criteria TEXT,
  requires_approval BOOLEAN DEFAULT true
);

-- Approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  stage_id UUID REFERENCES governance_stages(id),
  requested_by TEXT NOT NULL,
  approver TEXT,
  status TEXT DEFAULT 'pending',
  request_notes TEXT,
  decision_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom yearly calendars
CREATE TABLE IF NOT EXISTS custom_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  blackout_dates JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PM guidelines library
CREATE TABLE IF NOT EXISTS pm_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles (global)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-project permissions
CREATE TABLE IF NOT EXISTS project_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  permission_level TEXT NOT NULL,
  UNIQUE (project_id, user_email)
);

-- Headcount / workforce planning
CREATE TABLE IF NOT EXISTS headcount_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id TEXT NOT NULL,
  competence_id UUID,
  role_category TEXT,
  target_fte NUMERIC NOT NULL,
  effective_quarter INTEGER NOT NULL,
  effective_year INTEGER NOT NULL,
  notes TEXT
);

-- Extend projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimate_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS governance_stage_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS activation_status TEXT DEFAULT 'active';

-- Extend capital_assets table
ALTER TABLE capital_assets ADD COLUMN IF NOT EXISTS depreciation_years INTEGER;
ALTER TABLE capital_assets ADD COLUMN IF NOT EXISTS depreciation_method TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workstreams_project ON workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_workstream ON kanban_tasks(workstream_id);
CREATE INDEX IF NOT EXISTS idx_resource_skills_resource ON resource_skills(resource_id);
CREATE INDEX IF NOT EXISTS idx_spend_records_project ON spend_records(project_id);
CREATE INDEX IF NOT EXISTS idx_capital_asset_items_asset ON capital_asset_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_equipment_loans_asset ON equipment_loans(asset_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_email, read);
CREATE INDEX IF NOT EXISTS idx_project_permissions_project ON project_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_headcount_targets_bu ON headcount_targets(business_unit_id, effective_year);

-- Seed default governance stages
INSERT INTO governance_stages (name, sort_order, description, criteria, requires_approval)
VALUES
  ('Concept', 1, 'Initial idea and feasibility assessment', 'Business case documented', true),
  ('Planning', 2, 'Detailed planning and resource allocation', 'Project plan approved', true),
  ('Execution', 3, 'Active project delivery', 'All milestones on track', false),
  ('Validation', 4, 'Testing and acceptance', 'All acceptance criteria met', true),
  ('Closed', 5, 'Project completed and lessons learned', 'Post-mortem completed', false)
ON CONFLICT DO NOTHING;
