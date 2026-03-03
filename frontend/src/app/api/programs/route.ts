import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbProgram {
  id: string;
  name: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function mapProgram(row: DbProgram) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const rows = await query<DbProgram>('SELECT * FROM programs ORDER BY name');
    return NextResponse.json(rows.map(mapProgram));
  } catch (error) {
    console.error('GET /api/programs error:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status = 'active' } = body;
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbProgram>(
      'INSERT INTO programs (id, name, description, status) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, name, description ?? null, status]
    );
    return NextResponse.json(mapProgram(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/programs error:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
