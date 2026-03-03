import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbAlertRule {
  id: string;
  name: string;
  condition_type: string;
  condition_config: unknown;
  notification_channels: string[];
  escalation_hours: number | null;
  active: boolean;
  created_at: string;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, active } = body;
    const row = await queryOne<DbAlertRule>(
      'UPDATE alert_rules SET name=COALESCE($1,name), active=COALESCE($2,active) WHERE id=$3 RETURNING *',
      [name ?? null, active ?? null, id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: row.id, name: row.name, conditionType: row.condition_type,
      active: row.active, createdAt: row.created_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM alert_rules WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
