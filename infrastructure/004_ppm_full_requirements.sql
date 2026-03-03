-- 004_ppm_full_requirements.sql
-- PPM full requirements migration

-- 5-level hierarchy support
ALTER TABLE projects ADD COLUMN IF NOT EXISTS node_type TEXT NOT NULL DEFAULT 'project'
  CHECK (node_type IN ('portfolio','program','project','workstream','task'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_attributes JSONB NOT NULL DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cost_breakdown JSONB NOT NULL DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spend_records JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimate_quality TEXT CHECK (estimate_quality IN ('ROM','budget','definitive'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

CREATE INDEX IF NOT EXISTS idx_projects_custom_attrs ON projects USING GIN (custom_attributes);

CREATE TABLE IF NOT EXISTS project_ancestry (
  ancestor_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);
CREATE INDEX IF NOT EXISTS idx_ancestry_descendant ON project_ancestry(descendant_id);

CREATE TABLE IF NOT EXISTS custom_attribute_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text','number','select','boolean','date')),
  options JSONB,
  applies_to TEXT[] DEFAULT '{project}',
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_type TEXT NOT NULL DEFAULT 'portfolio',
  base_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_year INTEGER,
  start_quarter INTEGER,
  duration_quarters INTEGER,
  total_cost NUMERIC,
  status TEXT,
  visible BOOLEAN,
  revenue_estimates JSONB,
  extra_overrides JSONB,
  UNIQUE (scenario_id, project_id)
);

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  states JSONB NOT NULL,
  transitions JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_state TEXT NOT NULL DEFAULT 'draft',
  payload JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  scope_type TEXT,
  scope_id UUID,
  PRIMARY KEY (user_id, role_id, COALESCE(scope_type,''), COALESCE(scope_id::text,''))
);

-- Resources extension
ALTER TABLE resources ADD COLUMN IF NOT EXISTS labor_rate NUMERIC;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS seniority_level TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS employee_class TEXT;

-- Capital assets
CREATE TABLE IF NOT EXISTS capital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  value NUMERIC,
  depreciation_schedule JSONB,
  location TEXT,
  status TEXT,
  owner TEXT,
  calibration_due DATE,
  notes TEXT,
  custom_attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Custom calendar
CREATE TABLE IF NOT EXISTS project_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  blackout_dates DATE[] DEFAULT '{}',
  holidays JSONB DEFAULT '[]',
  applies_to TEXT[] DEFAULT '{}'
);

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_config JSONB NOT NULL,
  notification_channels TEXT[] DEFAULT '{email}',
  escalation_hours INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id),
  entity_type TEXT,
  entity_id UUID,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false
);

-- OKRs
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('objective','key_result')),
  parent_id UUID REFERENCES okrs(id),
  owner TEXT,
  target_value NUMERIC,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS project_okr_links (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  contribution_weight NUMERIC DEFAULT 1.0,
  PRIMARY KEY (project_id, okr_id)
);

-- Project dependencies (for critical path)
CREATE TABLE IF NOT EXISTS project_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  lag_days INTEGER DEFAULT 0,
  dependency_type TEXT DEFAULT 'finish-to-start'
    CHECK (dependency_type IN ('finish-to-start','start-to-start','finish-to-finish','start-to-finish')),
  UNIQUE (predecessor_id, successor_id)
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','at_risk')),
  description TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Risk register
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL DEFAULT 'project',
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  probability TEXT CHECK (probability IN ('low','medium','high')),
  impact TEXT CHECK (impact IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','closed','accepted')),
  owner TEXT,
  mitigation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed workflow definitions
INSERT INTO workflow_definitions (name, states, transitions) VALUES
(
  'budget_increase',
  '["draft","submitted","under_review","approved","rejected"]',
  '[{"from":"draft","to":"submitted","label":"Submit"},{"from":"submitted","to":"under_review","label":"Start review"},{"from":"under_review","to":"approved","label":"Approve"},{"from":"under_review","to":"rejected","label":"Reject"}]'
),
(
  'phase_exit',
  '["draft","submitted","approved","rejected"]',
  '[{"from":"draft","to":"submitted","label":"Submit for exit"},{"from":"submitted","to":"approved","label":"Approve exit"},{"from":"submitted","to":"rejected","label":"Reject exit"}]'
),
(
  'change_request',
  '["draft","submitted","under_review","approved","rejected","implemented"]',
  '[{"from":"draft","to":"submitted","label":"Submit"},{"from":"submitted","to":"under_review","label":"Review"},{"from":"under_review","to":"approved","label":"Approve"},{"from":"under_review","to":"rejected","label":"Reject"},{"from":"approved","to":"implemented","label":"Implement"}]'
),
(
  'project_kickoff',
  '["draft","ready","kicked_off"]',
  '[{"from":"draft","to":"ready","label":"Mark ready"},{"from":"ready","to":"kicked_off","label":"Kick off"}]'
)
ON CONFLICT (name) DO NOTHING;

-- Seed roles
INSERT INTO roles (name) VALUES ('viewer'),('editor'),('portfolio_manager'),('admin')
ON CONFLICT (name) DO NOTHING;

-- Seed custom attribute definitions
INSERT INTO custom_attribute_definitions (key, label, field_type, options, applies_to, sort_order) VALUES
('estimateQuality', 'Estimate quality', 'select', '["ROM","budget","definitive"]', '{project}', 1),
('stageGate', 'Stage gate', 'select', '["Ideation","Feasibility","Planning","Execution","Closure"]', '{project}', 2),
('strategicFit', 'Strategic fit score', 'number', NULL, '{project}', 3)
ON CONFLICT (key) DO NOTHING;
