import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

function mapRule(row: DbAlertRule) {
  return {
    id: row.id,
    name: row.name,
    conditionType: row.condition_type,
    conditionConfig: typeof row.condition_config === 'string' ? JSON.parse(row.condition_config) : row.condition_config,
    notificationChannels: row.notification_channels ?? [],
    escalationHours: row.escalation_hours,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const rows = await query<DbAlertRule>('SELECT * FROM alert_rules ORDER BY created_at DESC');
    return NextResponse.json(rows.map(mapRule));
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, conditionType, conditionConfig = {}, notificationChannels = ['email'], escalationHours } = body;
    if (!name || !conditionType) return NextResponse.json({ error: 'name and conditionType required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbAlertRule>(
      'INSERT INTO alert_rules (id, name, condition_type, condition_config, notification_channels, escalation_hours) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, name, conditionType, JSON.stringify(conditionConfig), notificationChannels, escalationHours ?? null]
    );
    return NextResponse.json(mapRule(row[0]), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
