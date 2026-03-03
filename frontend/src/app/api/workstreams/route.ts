import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const rows = await query<DbWorkstream>(
      projectId
        ? 'SELECT * FROM workstreams WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC'
        : 'SELECT * FROM workstreams ORDER BY sort_order ASC, created_at ASC',
      projectId ? [projectId] : []
    );
    return NextResponse.json(rows.map(mapWorkstream));
  } catch (error) {
    console.error('GET /api/workstreams error:', error);
    return NextResponse.json({ error: 'Failed to fetch workstreams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, description, status = 'active', sortOrder = 0 } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbWorkstream>(
      `INSERT INTO workstreams (id, project_id, name, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, projectId, name, description || null, status, sortOrder]
    );

    return NextResponse.json(mapWorkstream(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/workstreams error:', error);
    return NextResponse.json({ error: 'Failed to create workstream' }, { status: 500 });
  }
}
