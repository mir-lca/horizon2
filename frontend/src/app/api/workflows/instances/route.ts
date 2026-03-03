import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createWorkflowInstance } from '@/lib/workflow';

interface DbWorkflowInstance {
  id: string;
  definition_id: string;
  entity_type: string;
  entity_id: string;
  current_state: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  definition_name: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');
  try {
    const rows = await query<DbWorkflowInstance>(
      `SELECT wi.*, wd.name as definition_name
       FROM workflow_instances wi
       JOIN workflow_definitions wd ON wd.id = wi.definition_id
       WHERE ($1::uuid IS NULL OR wi.entity_id = $1)
         AND ($2 IS NULL OR wi.entity_type = $2)
       ORDER BY wi.created_at DESC`,
      [entityId ?? null, entityType ?? null]
    );
    return NextResponse.json(rows.map((r) => ({
      id: r.id,
      definitionId: r.definition_id,
      definitionName: r.definition_name,
      entityType: r.entity_type,
      entityId: r.entity_id,
      currentState: r.current_state,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })));
  } catch (error) {
    console.error('GET /api/workflows/instances error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { definitionName, entityType, entityId, createdBy = 'system' } = body;
    if (!definitionName || !entityType || !entityId) {
      return NextResponse.json({ error: 'definitionName, entityType, entityId required' }, { status: 400 });
    }
    const instance = await createWorkflowInstance(definitionName, entityType, entityId, createdBy);
    return NextResponse.json(instance, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/workflows/instances error:', error);
    return NextResponse.json({ error: error.message ?? 'Failed' }, { status: 500 });
  }
}
