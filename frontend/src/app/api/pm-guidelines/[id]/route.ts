import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbPmGuideline {
  id: string;
  title: string;
  content: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapPmGuideline(row: DbPmGuideline) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbPmGuideline>(
      'SELECT * FROM pm_guidelines WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapPmGuideline(row));
  } catch (error) {
    console.error('GET /api/pm-guidelines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch PM guideline' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, content, category, createdBy } = body;

    const row = await queryOne<DbPmGuideline>(
      `UPDATE pm_guidelines SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        category = COALESCE($3, category),
        created_by = COALESCE($4, created_by),
        updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [title || null, content || null, category || null, createdBy || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapPmGuideline(row));
  } catch (error) {
    console.error('PUT /api/pm-guidelines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update PM guideline' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM pm_guidelines WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/pm-guidelines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete PM guideline' }, { status: 500 });
  }
}
