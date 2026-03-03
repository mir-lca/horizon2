import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbApprovalRequest>(
      'SELECT * FROM approval_requests WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapApprovalRequest(row));
  } catch (error) {
    console.error('GET /api/approval-requests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch approval request' }, { status: 500 });
  }
}
