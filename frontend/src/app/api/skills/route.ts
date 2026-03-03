import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbSkill>(
      'SELECT * FROM skills ORDER BY name ASC',
      []
    );
    return NextResponse.json(rows.map(mapSkill));
  } catch (error) {
    console.error('GET /api/skills error:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbSkill>(
      `INSERT INTO skills (id, name, category, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, category || null, description || null]
    );

    return NextResponse.json(mapSkill(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/skills error:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
