import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbSkill {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
}

function mapSkill(row: DbSkill) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, category, description } = body;

    const row = await queryOne<DbSkill>(
      `UPDATE skills SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        description = COALESCE($3, description)
       WHERE id = $4
       RETURNING *`,
      [name, category || null, description || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapSkill(row));
  } catch (error) {
    console.error('PATCH /api/skills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM skills WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/skills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
