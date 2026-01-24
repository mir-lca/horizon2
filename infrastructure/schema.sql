CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  headcount NUMERIC,
  irr NUMERIC,
  revenue NUMERIC,
  cost NUMERIC,
  margin NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS initiative_financials (
  id UUID PRIMARY KEY,
  initiative_id UUID REFERENCES initiatives(id),
  quarter TEXT NOT NULL,
  revenue NUMERIC,
  cost NUMERIC,
  margin NUMERIC,
  cash_flow NUMERIC,
  irr NUMERIC
);

CREATE TABLE IF NOT EXISTS initiative_resources (
  id UUID PRIMARY KEY,
  initiative_id UUID REFERENCES initiatives(id),
  quarter TEXT NOT NULL,
  expertise TEXT NOT NULL,
  headcount NUMERIC
);

CREATE TABLE IF NOT EXISTS expertise_capacity (
  id UUID PRIMARY KEY,
  quarter TEXT NOT NULL,
  expertise TEXT NOT NULL,
  capacity NUMERIC
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  actor TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_units (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_unit_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competences (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  average_salary NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY,
  competence_id UUID REFERENCES competences(id),
  competence_name TEXT,
  quantity NUMERIC,
  yearly_wage NUMERIC,
  business_unit_id UUID REFERENCES business_units(id),
  business_unit_name TEXT,
  skills JSONB,
  name TEXT,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  business_unit_id UUID REFERENCES business_units(id),
  business_unit_name TEXT,
  risk_level TEXT,
  start_year INTEGER,
  start_quarter INTEGER,
  duration_quarters INTEGER,
  minimum_duration_quarters INTEGER,
  resource_allocations JSONB,
  total_cost NUMERIC,
  sm_cost_percentage NUMERIC,
  yearly_sustaining_cost NUMERIC,
  yearly_sustaining_costs JSONB,
  gross_margin_percentage NUMERIC,
  gross_margin_percentages JSONB,
  revenue_estimates JSONB,
  status TEXT,
  visible BOOLEAN DEFAULT true,
  funded BOOLEAN DEFAULT false,
  parent_project_id UUID,
  master_project_id UUID,
  financial_notes TEXT,
  maturity_level NUMERIC,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
