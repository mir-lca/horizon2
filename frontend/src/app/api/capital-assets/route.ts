import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbCapitalAsset {
  id: string;
  name: string;
  asset_type: string;
  project_id: string | null;
  value: number | null;
  location: string | null;
  status: string | null;
  owner: string | null;
  calibration_due: string | null;
  notes: string | null;
  custom_attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function mapCapitalAsset(row: DbCapitalAsset) {
  return {
    id: row.id,
    name: row.name,
    assetType: row.asset_type,
    projectId: row.project_id,
    value: row.value,
    location: row.location,
    status: row.status,
    owner: row.owner,
    calibrationDue: row.calibration_due,
    notes: row.notes,
    customAttributes: row.custom_attributes ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const rows = await query<DbCapitalAsset>('SELECT * FROM capital_assets ORDER BY name');
    return NextResponse.json(rows.map(mapCapitalAsset));
  } catch (error) {
    console.error('GET /api/capital-assets error:', error);
    return NextResponse.json({ error: 'Failed to fetch capital assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, assetType, projectId, value, location, status, owner, calibrationDue, notes } = body;

    if (!name || !assetType) {
      return NextResponse.json({ error: 'name and assetType are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbCapitalAsset>(
      `INSERT INTO capital_assets (id, name, asset_type, project_id, value, location, status, owner, calibration_due, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, name, assetType, projectId ?? null, value ?? null, location ?? null, status ?? 'active', owner ?? null, calibrationDue ?? null, notes ?? null]
    );

    return NextResponse.json(mapCapitalAsset(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/capital-assets error:', error);
    return NextResponse.json({ error: 'Failed to create capital asset' }, { status: 500 });
  }
}
