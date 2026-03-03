import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbMilestone {
  id: string;
  project_id: string;
  name: string;
  due_date: string | null;
  status: string;
  description: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

function mapMilestone(row: DbMilestone) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    dueDate: row.due_date,
    status: row.status,
    description: row.description,
    owner: row.owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, dueDate, status, description, owner } = body;

    const row = await queryOne<DbMilestone>(
      `UPDATE milestones SET
        name = COALESCE($1, name),
        due_date = COALESCE($2, due_date),
        status = COALESCE($3, status),
        description = COALESCE($4, description),
        owner = COALESCE($5, owner),
        updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [name, dueDate || null, status, description || null, owner || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapMilestone(row));
  } catch (error) {
    console.error('PATCH /api/milestones/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM milestones WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/milestones/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
