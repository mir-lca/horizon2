import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbGovernanceStage {
  id: string;
  name: string;
  sort_order: number;
  description: string | null;
  criteria: string | null;
  requires_approval: boolean;
}

function mapGovernanceStage(row: DbGovernanceStage) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    description: row.description,
    criteria: row.criteria,
    requiresApproval: row.requires_approval,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbGovernanceStage>(
      'SELECT * FROM governance_stages ORDER BY sort_order ASC',
      []
    );
    return NextResponse.json(rows.map(mapGovernanceStage));
  } catch (error) {
    console.error('GET /api/governance-stages error:', error);
    return NextResponse.json({ error: 'Failed to fetch governance stages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sortOrder, description, criteria, requiresApproval = false } = body;

    if (!name || sortOrder === undefined || sortOrder === null) {
      return NextResponse.json({ error: 'name and sortOrder are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbGovernanceStage>(
      `INSERT INTO governance_stages (id, name, sort_order, description, criteria, requires_approval)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, sortOrder, description || null, criteria || null, requiresApproval]
    );

    return NextResponse.json(mapGovernanceStage(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/governance-stages error:', error);
    return NextResponse.json({ error: 'Failed to create governance stage' }, { status: 500 });
  }
}
