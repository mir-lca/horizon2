import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbCapitalAssetItem>(
      'SELECT * FROM capital_asset_items WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCapitalAssetItem(row));
  } catch (error) {
    console.error('GET /api/capital-asset-items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch capital asset item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { assetId, name, quantity, unitCost, acquiredDate, serialNumber } = body;

    const row = await queryOne<DbCapitalAssetItem>(
      `UPDATE capital_asset_items SET
        asset_id = COALESCE($1, asset_id),
        name = COALESCE($2, name),
        quantity = COALESCE($3, quantity),
        unit_cost = COALESCE($4, unit_cost),
        acquired_date = COALESCE($5, acquired_date),
        serial_number = COALESCE($6, serial_number)
       WHERE id = $7
       RETURNING *`,
      [assetId || null, name || null, quantity ?? null, unitCost ?? null, acquiredDate || null, serialNumber || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCapitalAssetItem(row));
  } catch (error) {
    console.error('PUT /api/capital-asset-items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update capital asset item' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM capital_asset_items WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/capital-asset-items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete capital asset item' }, { status: 500 });
  }
}
