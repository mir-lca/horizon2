import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbRisk {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string | null;
  probability: string | null;
  impact: string | null;
  status: string;
  owner: string | null;
  mitigation: string | null;
  created_at: string;
  updated_at: string;
}

function mapRisk(row: DbRisk) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    description: row.description,
    probability: row.probability,
    impact: row.impact,
    status: row.status,
    owner: row.owner,
    mitigation: row.mitigation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, probability, impact, status, owner, mitigation } = body;

    const row = await queryOne<DbRisk>(
      `UPDATE risks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        probability = COALESCE($3, probability),
        impact = COALESCE($4, impact),
        status = COALESCE($5, status),
        owner = COALESCE($6, owner),
        mitigation = COALESCE($7, mitigation),
        updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [title, description || null, probability || null, impact || null, status, owner || null, mitigation || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapRisk(row));
  } catch (error) {
    console.error('PATCH /api/risks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM risks WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/risks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete risk' }, { status: 500 });
  }
}
