import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface DbAuditLog {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  performed_by: string | null;
  details: unknown;
  created_at: string;
}

function mapAuditLog(row: DbAuditLog) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    performedBy: row.performed_by,
    details: row.details,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<DbAuditLog>(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT 100`,
      values
    );
    return NextResponse.json(rows.map(mapAuditLog));
  } catch (error) {
    console.error('GET /api/audit-log error:', error);
    // If the table does not exist, return empty array rather than an error
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
