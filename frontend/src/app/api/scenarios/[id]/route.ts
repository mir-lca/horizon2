import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbScenario>('SELECT * FROM scenarios WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapScenario(row));
  } catch (error) {
    console.error('GET /api/scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, status } = body;
    const row = await queryOne<DbScenario>(
      'UPDATE scenarios SET name=COALESCE($1,name), description=COALESCE($2,description), status=COALESCE($3,status), updated_at=now() WHERE id=$4 RETURNING *',
      [name, description ?? null, status, id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapScenario(row));
  } catch (error) {
    console.error('PUT /api/scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM scenarios WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
