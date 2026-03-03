import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  try {
    const rows = await query<DbEquipmentLoan>(
      assetId
        ? 'SELECT * FROM equipment_loans WHERE asset_id = $1 ORDER BY loaned_at DESC'
        : 'SELECT * FROM equipment_loans ORDER BY loaned_at DESC',
      assetId ? [assetId] : []
    );
    return NextResponse.json(rows.map(mapEquipmentLoan));
  } catch (error) {
    console.error('GET /api/equipment-loans error:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment loans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, loanedTo, loanedAt, returnBy, returnedAt, notes } = body;

    if (!assetId || !loanedTo || !loanedAt) {
      return NextResponse.json({ error: 'assetId, loanedTo, and loanedAt are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbEquipmentLoan>(
      `INSERT INTO equipment_loans (id, asset_id, loaned_to, loaned_at, return_by, returned_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, assetId, loanedTo, loanedAt, returnBy || null, returnedAt || null, notes || null]
    );

    return NextResponse.json(mapEquipmentLoan(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/equipment-loans error:', error);
    return NextResponse.json({ error: 'Failed to create equipment loan' }, { status: 500 });
  }
}
