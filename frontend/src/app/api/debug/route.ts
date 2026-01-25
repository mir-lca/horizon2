import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'not set',
      nodeVersion: process.version,
      platform: process.platform,
    },
    connectionTest: null as any,
  };

  // Try to import and test pg
  try {
    const { Pool } = await import('pg');

    if (!process.env.DATABASE_URL) {
      diagnostics.connectionTest = {
        error: 'DATABASE_URL not found in environment variables',
        availableEnvVars: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')),
      };
      return NextResponse.json(diagnostics);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    const result = await pool.query('SELECT NOW() as current_time');
    await pool.end();

    diagnostics.connectionTest = {
      success: true,
      currentTime: result.rows[0].current_time,
    };
  } catch (error: any) {
    diagnostics.connectionTest = {
      error: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3),
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
