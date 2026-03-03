import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbWorkstream {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

function mapWorkstream(row: DbWorkstream) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, status, sortOrder } = body;

    const row = await queryOne<DbWorkstream>(
      `UPDATE workstreams SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        sort_order = COALESCE($4, sort_order)
       WHERE id = $5
       RETURNING *`,
      [name, description || null, status, sortOrder ?? null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapWorkstream(row));
  } catch (error) {
    console.error('PATCH /api/workstreams/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update workstream' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM workstreams WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workstreams/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete workstream' }, { status: 500 });
  }
}
