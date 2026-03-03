import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbApprovalRequest {
  id: string;
  entity_type: string;
  entity_id: string;
  request_type: string;
  stage_id: string | null;
  requested_by: string;
  approver: string | null;
  status: string;
  request_notes: string | null;
  decision_notes: string | null;
  requested_at: string;
  decided_at: string | null;
}

function mapApprovalRequest(row: DbApprovalRequest) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestType: row.request_type,
    stageId: row.stage_id,
    requestedBy: row.requested_by,
    approver: row.approver,
    status: row.status,
    requestNotes: row.request_notes,
    decisionNotes: row.decision_notes,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const status = searchParams.get('status');

  try {
    const conditions: string[] = [];
    const values: string[] = [];

    if (entityType) {
      values.push(entityType);
      conditions.push(`entity_type = $${values.length}`);
    }
    if (entityId) {
      values.push(entityId);
      conditions.push(`entity_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<DbApprovalRequest>(
      `SELECT * FROM approval_requests ${where} ORDER BY requested_at DESC`,
      values
    );
    return NextResponse.json(rows.map(mapApprovalRequest));
  } catch (error) {
    console.error('GET /api/approval-requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch approval requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, requestType, stageId, requestedBy, approver, status = 'pending', requestNotes } = body;

    if (!entityType || !entityId || !requestType || !requestedBy) {
      return NextResponse.json(
        { error: 'entityType, entityId, requestType, and requestedBy are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const row = await query<DbApprovalRequest>(
      `INSERT INTO approval_requests (id, entity_type, entity_id, request_type, stage_id, requested_by, approver, status, request_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, entityType, entityId, requestType, stageId || null, requestedBy, approver || null, status, requestNotes || null]
    );

    return NextResponse.json(mapApprovalRequest(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/approval-requests error:', error);
    return NextResponse.json({ error: 'Failed to create approval request' }, { status: 500 });
  }
}
