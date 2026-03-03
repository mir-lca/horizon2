import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbEquipmentLoan {
  id: string;
  asset_id: string;
  loaned_to: string;
  loaned_at: string;
  return_by: string | null;
  returned_at: string | null;
  notes: string | null;
}

function mapEquipmentLoan(row: DbEquipmentLoan) {
  return {
    id: row.id,
    assetId: row.asset_id,
    loanedTo: row.loaned_to,
    loanedAt: row.loaned_at,
    returnBy: row.return_by,
    returnedAt: row.returned_at,
    notes: row.notes,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbEquipmentLoan>(
      'SELECT * FROM equipment_loans WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapEquipmentLoan(row));
  } catch (error) {
    console.error('GET /api/equipment-loans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment loan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { assetId, loanedTo, loanedAt, returnBy, returnedAt, notes } = body;

    const row = await queryOne<DbEquipmentLoan>(
      `UPDATE equipment_loans SET
        asset_id = COALESCE($1, asset_id),
        loaned_to = COALESCE($2, loaned_to),
        loaned_at = COALESCE($3, loaned_at),
        return_by = COALESCE($4, return_by),
        returned_at = COALESCE($5, returned_at),
        notes = COALESCE($6, notes)
       WHERE id = $7
       RETURNING *`,
      [assetId || null, loanedTo || null, loanedAt || null, returnBy || null, returnedAt || null, notes || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapEquipmentLoan(row));
  } catch (error) {
    console.error('PUT /api/equipment-loans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update equipment loan' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM equipment_loans WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/equipment-loans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete equipment loan' }, { status: 500 });
  }
}
