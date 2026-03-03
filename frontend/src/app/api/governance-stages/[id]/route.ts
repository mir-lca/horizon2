import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbGovernanceStage {
  id: string;
  name: string;
  sort_order: number;
  description: string | null;
  criteria: string | null;
  requires_approval: boolean;
}

function mapGovernanceStage(row: DbGovernanceStage) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    description: row.description,
    criteria: row.criteria,
    requiresApproval: row.requires_approval,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbGovernanceStage>(
      'SELECT * FROM governance_stages WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapGovernanceStage(row));
  } catch (error) {
    console.error('GET /api/governance-stages/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch governance stage' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, sortOrder, description, criteria, requiresApproval } = body;

    const row = await queryOne<DbGovernanceStage>(
      `UPDATE governance_stages SET
        name = COALESCE($1, name),
        sort_order = COALESCE($2, sort_order),
        description = COALESCE($3, description),
        criteria = COALESCE($4, criteria),
        requires_approval = COALESCE($5, requires_approval)
       WHERE id = $6
       RETURNING *`,
      [name, sortOrder ?? null, description || null, criteria || null, requiresApproval ?? null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapGovernanceStage(row));
  } catch (error) {
    console.error('PUT /api/governance-stages/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update governance stage' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM governance_stages WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/governance-stages/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete governance stage' }, { status: 500 });
  }
}
