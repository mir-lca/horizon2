import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Azure PostgreSQL
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // 30 seconds for Azure PostgreSQL
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
      pool = null; // Reset pool on error
    });
  }

  return pool;
}

/**
 * Execute a query and return all rows
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = getPool();
  try {
    const result: QueryResult<T> = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a query (for INSERT/UPDATE/DELETE)
 */
export async function execute(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const client = getPool();
  try {
    return await client.query(text, params);
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

/**
 * Get a client for transaction support
 */
export async function getClient() {
  return getPool().connect();
}

/**
 * Close the database pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Type definitions for common database models
export interface Project {
  id: string;
  name: string;
  description?: string;
  businessUnitId?: string;
  businessUnitName?: string;
  riskLevel?: string;
  startYear?: number;
  startQuarter?: number;
  durationQuarters?: number;
  minimumDurationQuarters?: number;
  resourceAllocations?: any;
  totalCost?: number;
  smCostPercentage?: number;
  yearlySustainingCost?: number;
  yearlySustainingCosts?: any;
  grossMarginPercentage?: number;
  grossMarginPercentages?: any;
  revenueEstimates?: any;
  status?: string;
  visible?: boolean;
  parentProjectId?: string;
  masterProjectId?: string;
  financialNotes?: string;
  maturityLevel?: number;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BusinessUnit {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Competence {
  id: string;
  name: string;
  description?: string;
  category?: string;
  averageSalary?: number;
}

export interface Resource {
  id: string;
  name: string;
  email?: string;
  competenceId?: string;
  businessUnitId?: string;
  allocatedQuarters?: number;
  notes?: string;
}
