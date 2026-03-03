import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbProgram>('SELECT * FROM programs WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapProgram(row));
  } catch (error) {
    console.error('GET /api/programs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, status } = body;

    const row = await queryOne<DbProgram>(
      `UPDATE programs SET
        name = COALESCE($1, name),
        description = $2,
        status = COALESCE($3, status),
        updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [name, description ?? null, status, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapProgram(row));
  } catch (error) {
    console.error('PUT /api/programs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM programs WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/programs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
