import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbProjectPermission {
  id: string;
  project_id: string;
  user_email: string;
  permission_level: string;
}

function mapProjectPermission(row: DbProjectPermission) {
  return {
    id: row.id,
    projectId: row.project_id,
    userEmail: row.user_email,
    permissionLevel: row.permission_level,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const rows = await query<DbProjectPermission>(
      projectId
        ? 'SELECT * FROM project_permissions WHERE project_id = $1'
        : 'SELECT * FROM project_permissions',
      projectId ? [projectId] : []
    );
    return NextResponse.json(rows.map(mapProjectPermission));
  } catch (error) {
    console.error('GET /api/project-permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch project permissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userEmail, permissionLevel } = body;

    if (!projectId || !userEmail || !permissionLevel) {
      return NextResponse.json(
        { error: 'projectId, userEmail, and permissionLevel are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const row = await query<DbProjectPermission>(
      `INSERT INTO project_permissions (id, project_id, user_email, permission_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, user_email) DO UPDATE SET permission_level = $4
       RETURNING *`,
      [id, projectId, userEmail, permissionLevel]
    );

    return NextResponse.json(mapProjectPermission(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/project-permissions error:', error);
    return NextResponse.json({ error: 'Failed to create project permission' }, { status: 500 });
  }
}
