import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbKanbanTask {
  id: string;
  project_id: string;
  workstream_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  story_points: number | null;
  assignee: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

function mapKanbanTask(row: DbKanbanTask) {
  return {
    id: row.id,
    projectId: row.project_id,
    workstreamId: row.workstream_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    storyPoints: row.story_points,
    assignee: row.assignee,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const workstreamId = searchParams.get('workstreamId');

  try {
    let sql: string;
    let args: string[];

    if (projectId && workstreamId) {
      sql = 'SELECT * FROM kanban_tasks WHERE project_id = $1 AND workstream_id = $2 ORDER BY sort_order ASC, created_at ASC';
      args = [projectId, workstreamId];
    } else if (projectId) {
      sql = 'SELECT * FROM kanban_tasks WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC';
      args = [projectId];
    } else if (workstreamId) {
      sql = 'SELECT * FROM kanban_tasks WHERE workstream_id = $1 ORDER BY sort_order ASC, created_at ASC';
      args = [workstreamId];
    } else {
      sql = 'SELECT * FROM kanban_tasks ORDER BY sort_order ASC, created_at ASC';
      args = [];
    }

    const rows = await query<DbKanbanTask>(sql, args);
    return NextResponse.json(rows.map(mapKanbanTask));
  } catch (error) {
    console.error('GET /api/kanban-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      workstreamId,
      title,
      description,
      status = 'backlog',
      priority = 'medium',
      storyPoints,
      assignee,
      dueDate,
      sortOrder = 0,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbKanbanTask>(
      `INSERT INTO kanban_tasks (id, project_id, workstream_id, title, description, status, priority, story_points, assignee, due_date, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, projectId, workstreamId || null, title, description || null, status, priority, storyPoints ?? null, assignee || null, dueDate || null, sortOrder]
    );

    return NextResponse.json(mapKanbanTask(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/kanban-tasks error:', error);
    return NextResponse.json({ error: 'Failed to create kanban task' }, { status: 500 });
  }
}
