import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbScenario {
  id: string;
  name: string;
  description: string | null;
  base_type: string;
  base_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapScenario(row: DbScenario) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baseType: row.base_type,
    baseId: row.base_id,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const rows = await query<DbScenario>('SELECT * FROM scenarios ORDER BY created_at DESC');
    return NextResponse.json(rows.map(mapScenario));
  } catch (error) {
    console.error('GET /api/scenarios error:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, baseType = 'portfolio', baseId, createdBy } = body;
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbScenario>(
      'INSERT INTO scenarios (id, name, description, base_type, base_id, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, name, description ?? null, baseType, baseId ?? null, createdBy ?? null]
    );
    return NextResponse.json(mapScenario(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/scenarios error:', error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}
