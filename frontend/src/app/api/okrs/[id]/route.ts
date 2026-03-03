import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbOkr {
  id: string;
  title: string;
  description: string | null;
  type: string;
  parent_id: string | null;
  owner: string | null;
  target_value: number | null;
  unit: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

function mapOkr(row: DbOkr) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    parentId: row.parent_id,
    owner: row.owner,
    targetValue: row.target_value,
    unit: row.unit,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbOkr>('SELECT * FROM okrs WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapOkr(row));
  } catch (error) {
    console.error('GET /api/okrs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch OKR' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, type, parentId, owner, targetValue, unit, startDate, endDate, status } = body;

    const row = await queryOne<DbOkr>(
      `UPDATE okrs SET
        title = COALESCE($1, title),
        description = $2,
        type = COALESCE($3, type),
        parent_id = $4,
        owner = $5,
        target_value = $6,
        unit = $7,
        start_date = $8,
        end_date = $9,
        status = COALESCE($10, status)
       WHERE id = $11
       RETURNING *`,
      [title, description ?? null, type, parentId ?? null, owner ?? null, targetValue ?? null, unit ?? null, startDate ?? null, endDate ?? null, status, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapOkr(row));
  } catch (error) {
    console.error('PUT /api/okrs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update OKR' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM okrs WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/okrs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete OKR' }, { status: 500 });
  }
}
