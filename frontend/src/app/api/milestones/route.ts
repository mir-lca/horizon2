import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const rows = await query<DbMilestone>(
      projectId
        ? 'SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date ASC NULLS LAST, created_at ASC'
        : 'SELECT * FROM milestones ORDER BY due_date ASC NULLS LAST',
      projectId ? [projectId] : []
    );
    return NextResponse.json(rows.map(mapMilestone));
  } catch (error) {
    console.error('GET /api/milestones error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, dueDate, status = 'pending', description, owner } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbMilestone>(
      `INSERT INTO milestones (id, project_id, name, due_date, status, description, owner)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, projectId, name, dueDate || null, status, description || null, owner || null]
    );

    return NextResponse.json(mapMilestone(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/milestones error:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}
