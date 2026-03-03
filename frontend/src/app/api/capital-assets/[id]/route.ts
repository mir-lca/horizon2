import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbCapitalAsset>('SELECT * FROM capital_assets WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCapitalAsset(row));
  } catch (error) {
    console.error('GET /api/capital-assets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch capital asset' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, assetType, projectId, value, location, status, owner, calibrationDue, notes } = body;

    const row = await queryOne<DbCapitalAsset>(
      `UPDATE capital_assets SET
        name = COALESCE($1, name),
        asset_type = COALESCE($2, asset_type),
        project_id = $3,
        value = $4,
        location = $5,
        status = COALESCE($6, status),
        owner = $7,
        calibration_due = $8,
        notes = $9,
        updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [name, assetType, projectId ?? null, value ?? null, location ?? null, status, owner ?? null, calibrationDue ?? null, notes ?? null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCapitalAsset(row));
  } catch (error) {
    console.error('PUT /api/capital-assets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update capital asset' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM capital_assets WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/capital-assets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete capital asset' }, { status: 500 });
  }
}
