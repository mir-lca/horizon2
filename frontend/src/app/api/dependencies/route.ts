import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  lag_days: number;
  dependency_type: string;
}

function mapDep(row: DbDependency) {
  return {
    id: row.id,
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    lagDays: row.lag_days,
    dependencyType: row.dependency_type,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  try {
    const rows = await query<DbDependency>(
      projectId
        ? 'SELECT * FROM project_dependencies WHERE predecessor_id=$1 OR successor_id=$1'
        : 'SELECT * FROM project_dependencies',
      projectId ? [projectId] : []
    );
    return NextResponse.json(rows.map(mapDep));
  } catch (error) {
    console.error('GET /api/dependencies error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predecessorId, successorId, lagDays = 0, dependencyType = 'finish-to-start' } = body;
    if (!predecessorId || !successorId) return NextResponse.json({ error: 'predecessorId and successorId required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbDependency>(
      'INSERT INTO project_dependencies (id, predecessor_id, successor_id, lag_days, dependency_type) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (predecessor_id, successor_id) DO UPDATE SET lag_days=$4, dependency_type=$5 RETURNING *',
      [id, predecessorId, successorId, lagDays, dependencyType]
    );
    return NextResponse.json(mapDep(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/dependencies error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    await execute('DELETE FROM project_dependencies WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/dependencies error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
