import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbPmGuideline>(
      'SELECT * FROM pm_guidelines ORDER BY category ASC, title ASC',
      []
    );
    return NextResponse.json(rows.map(mapPmGuideline));
  } catch (error) {
    console.error('GET /api/pm-guidelines error:', error);
    return NextResponse.json({ error: 'Failed to fetch PM guidelines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, createdBy } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbPmGuideline>(
      `INSERT INTO pm_guidelines (id, title, content, category, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, title, content, category || null, createdBy || null]
    );

    return NextResponse.json(mapPmGuideline(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/pm-guidelines error:', error);
    return NextResponse.json({ error: 'Failed to create PM guideline' }, { status: 500 });
  }
}
