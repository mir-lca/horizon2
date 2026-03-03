import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { workstreamId, title, description, status, priority, storyPoints, assignee, dueDate, sortOrder } = body;

    const row = await queryOne<DbKanbanTask>(
      `UPDATE kanban_tasks SET
        workstream_id = COALESCE($1, workstream_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        story_points = COALESCE($6, story_points),
        assignee = COALESCE($7, assignee),
        due_date = COALESCE($8, due_date),
        sort_order = COALESCE($9, sort_order)
       WHERE id = $10
       RETURNING *`,
      [workstreamId || null, title, description || null, status, priority, storyPoints ?? null, assignee || null, dueDate || null, sortOrder ?? null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapKanbanTask(row));
  } catch (error) {
    console.error('PATCH /api/kanban-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update kanban task' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM kanban_tasks WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/kanban-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete kanban task' }, { status: 500 });
  }
}
