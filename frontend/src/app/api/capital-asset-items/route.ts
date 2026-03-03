import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbCapitalAssetItem {
  id: string;
  asset_id: string;
  name: string;
  quantity: number | null;
  unit_cost: number | null;
  acquired_date: string | null;
  serial_number: string | null;
}

function mapCapitalAssetItem(row: DbCapitalAssetItem) {
  return {
    id: row.id,
    assetId: row.asset_id,
    name: row.name,
    quantity: row.quantity,
    unitCost: row.unit_cost,
    acquiredDate: row.acquired_date,
    serialNumber: row.serial_number,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  try {
    const rows = await query<DbCapitalAssetItem>(
      assetId
        ? 'SELECT * FROM capital_asset_items WHERE asset_id = $1 ORDER BY name ASC'
        : 'SELECT * FROM capital_asset_items ORDER BY name ASC',
      assetId ? [assetId] : []
    );
    return NextResponse.json(rows.map(mapCapitalAssetItem));
  } catch (error) {
    console.error('GET /api/capital-asset-items error:', error);
    return NextResponse.json({ error: 'Failed to fetch capital asset items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, name, quantity, unitCost, acquiredDate, serialNumber } = body;

    if (!assetId || !name) {
      return NextResponse.json({ error: 'assetId and name are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbCapitalAssetItem>(
      `INSERT INTO capital_asset_items (id, asset_id, name, quantity, unit_cost, acquired_date, serial_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, assetId, name, quantity ?? null, unitCost ?? null, acquiredDate || null, serialNumber || null]
    );

    return NextResponse.json(mapCapitalAssetItem(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/capital-asset-items error:', error);
    return NextResponse.json({ error: 'Failed to create capital asset item' }, { status: 500 });
  }
}
