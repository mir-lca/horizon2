import logging
import psycopg2
from psycopg2.extras import RealDictCursor, register_uuid

logger = logging.getLogger(__name__)
register_uuid()

SCHEMA_SQL = """
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
  business_unit_id TEXT,
  skills JSONB,
  name TEXT,
  is_ai BOOLEAN DEFAULT false,
  employee_references JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_business_unit_id ON resources(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_resources_employee_references ON resources USING GIN (employee_references);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  business_unit_id TEXT,
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
  parent_project_id UUID,
  master_project_id UUID,
  financial_notes TEXT,
  maturity_level NUMERIC,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_business_unit_id ON projects(business_unit_id);
"""


class Database:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._schema_ready = False

    def ensure_schema(self):
        if self._schema_ready:
            return
        with psycopg2.connect(self.connection_string) as conn:
            with conn.cursor() as cur:
                for statement in SCHEMA_SQL.split(";"):
                    stmt = statement.strip()
                    if not stmt:
                        continue
                    cur.execute(stmt + ";")

                # CRITICAL MIGRATION: Add funded column if missing
                # This fixes bytecode caching issue where old code expects this column
                try:
                    cur.execute("""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'projects' AND column_name = 'funded'
                    """)
                    if not cur.fetchone():
                        logger.info("MIGRATION: Adding funded column to projects table")
                        cur.execute("ALTER TABLE projects ADD COLUMN funded BOOLEAN DEFAULT false")
                        logger.info("MIGRATION: Successfully added funded column")
                    else:
                        logger.info("MIGRATION: funded column already exists, skipping")
                except Exception as e:
                    logger.error(f"MIGRATION ERROR: {e}")
                    # Don't raise - allow app to continue even if migration fails

                # ORG DATA INTEGRATION MIGRATION
                self._migrate_to_org_data_integration(cur)

            conn.commit()
        self._schema_ready = True

    def _migrate_to_org_data_integration(self, cur):
        """
        Migrate database to use org data as single source of truth for business units.

        Changes:
        1. Drop business_units table (no longer storing BUs in Horizon)
        2. Change projects.business_unit_id from UUID to TEXT (stores org data IDs like "ur", "mir")
        3. Remove projects.business_unit_name (fetch from org data on-demand)
        4. Change resources.business_unit_id from UUID to TEXT (stores org data IDs)
        5. Remove resources.business_unit_name (fetch from org data on-demand)
        6. Add resources.employee_references JSONB (optional employee linking)
        """
        try:
            logger.info("ORG DATA MIGRATION: Starting org data integration migration")

            # Step 1: Check if business_units table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'business_units'
                )
            """)
            bu_table_exists = cur.fetchone()[0]

            if bu_table_exists:
                logger.info("ORG DATA MIGRATION: Dropping business_units table")

                # Drop foreign key constraints first
                cur.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_business_unit_id_fkey")
                cur.execute("ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_business_unit_id_fkey")

                # Drop the table
                cur.execute("DROP TABLE IF EXISTS business_units")
                logger.info("ORG DATA MIGRATION: business_units table dropped")
            else:
                logger.info("ORG DATA MIGRATION: business_units table already dropped, skipping")

            # Step 2: Update projects table
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'projects' AND column_name = 'business_unit_id'
            """)
            projects_bu_col = cur.fetchone()

            if projects_bu_col and projects_bu_col[1] != 'text':
                logger.info("ORG DATA MIGRATION: Migrating projects.business_unit_id to TEXT")

                # Drop foreign key if exists
                cur.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_business_unit_id_fkey")

                # Change column type to TEXT (will set existing UUIDs to NULL since they're invalid org data IDs)
                cur.execute("ALTER TABLE projects ALTER COLUMN business_unit_id DROP DEFAULT")
                cur.execute("ALTER TABLE projects ALTER COLUMN business_unit_id TYPE TEXT USING NULL")

                # Remove business_unit_name column
                cur.execute("ALTER TABLE projects DROP COLUMN IF EXISTS business_unit_name")

                # Create index
                cur.execute("CREATE INDEX IF NOT EXISTS idx_projects_business_unit_id ON projects(business_unit_id)")

                logger.info("ORG DATA MIGRATION: projects table migrated successfully")
            else:
                logger.info("ORG DATA MIGRATION: projects.business_unit_id already TEXT, skipping")

            # Step 3: Update resources table
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'resources' AND column_name = 'business_unit_id'
            """)
            resources_bu_col = cur.fetchone()

            if resources_bu_col and resources_bu_col[1] != 'text':
                logger.info("ORG DATA MIGRATION: Migrating resources.business_unit_id to TEXT")

                # Drop foreign key if exists
                cur.execute("ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_business_unit_id_fkey")

                # Change column type to TEXT
                cur.execute("ALTER TABLE resources ALTER COLUMN business_unit_id DROP DEFAULT")
                cur.execute("ALTER TABLE resources ALTER COLUMN business_unit_id TYPE TEXT USING NULL")

                # Remove business_unit_name column
                cur.execute("ALTER TABLE resources DROP COLUMN IF EXISTS business_unit_name")

                # Create index
                cur.execute("CREATE INDEX IF NOT EXISTS idx_resources_business_unit_id ON resources(business_unit_id)")

                logger.info("ORG DATA MIGRATION: resources.business_unit_id migrated successfully")
            else:
                logger.info("ORG DATA MIGRATION: resources.business_unit_id already TEXT, skipping")

            # Step 4: Add employee_references to resources if missing
            cur.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'resources' AND column_name = 'employee_references'
            """)
            if not cur.fetchone():
                logger.info("ORG DATA MIGRATION: Adding employee_references column to resources")
                cur.execute("ALTER TABLE resources ADD COLUMN employee_references JSONB")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_resources_employee_references ON resources USING GIN (employee_references)")
                logger.info("ORG DATA MIGRATION: employee_references column added")
            else:
                logger.info("ORG DATA MIGRATION: employee_references column already exists, skipping")

            logger.info("ORG DATA MIGRATION: Migration completed successfully")

        except Exception as e:
            logger.error(f"ORG DATA MIGRATION ERROR: {e}")
            # Don't raise - allow app to continue even if migration fails

    def fetch_all(self, query: str, params: tuple = None):
        with psycopg2.connect(self.connection_string) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return [dict(row) for row in cur.fetchall()]

    def fetch_one(self, query: str, params: tuple = None):
        with psycopg2.connect(self.connection_string) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                row = cur.fetchone()
                return dict(row) if row else None

    def execute(self, query: str, params: tuple = None):
        with psycopg2.connect(self.connection_string) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                conn.commit()


_db_instance = None


def get_database(connection_string: str):
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(connection_string)
        logger.info("Database connection initialized")
        _db_instance.ensure_schema()
    return _db_instance
