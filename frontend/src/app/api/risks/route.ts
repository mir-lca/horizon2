import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbRisk {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string | null;
  probability: string | null;
  impact: string | null;
  status: string;
  owner: string | null;
  mitigation: string | null;
  created_at: string;
  updated_at: string;
}

function mapRisk(row: DbRisk) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    description: row.description,
    probability: row.probability,
    impact: row.impact,
    status: row.status,
    owner: row.owner,
    mitigation: row.mitigation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType') || 'project';

  try {
    const rows = await query<DbRisk>(
      entityId
        ? 'SELECT * FROM risks WHERE entity_id = $1 AND entity_type = $2 ORDER BY created_at DESC'
        : 'SELECT * FROM risks ORDER BY created_at DESC',
      entityId ? [entityId, entityType] : []
    );
    return NextResponse.json(rows.map(mapRisk));
  } catch (error) {
    console.error('GET /api/risks error:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType = 'project', entityId, title, description, probability, impact, status = 'open', owner, mitigation } = body;

    if (!entityId || !title) {
      return NextResponse.json({ error: 'entityId and title are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbRisk>(
      `INSERT INTO risks (id, entity_type, entity_id, title, description, probability, impact, status, owner, mitigation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, entityType, entityId, title, description || null, probability || null, impact || null, status, owner || null, mitigation || null]
    );

    return NextResponse.json(mapRisk(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/risks error:', error);
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}
