import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbSpendRecord {
  id: string;
  project_id: string;
  amount: number;
  category: string;
  subcategory: string | null;
  description: string | null;
  record_date: string;
  po_number: string | null;
  so_number: string | null;
  vendor: string | null;
  is_actual: boolean;
  created_at: string;
}

function mapSpendRecord(row: DbSpendRecord) {
  return {
    id: row.id,
    projectId: row.project_id,
    amount: row.amount,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    recordDate: row.record_date,
    poNumber: row.po_number,
    soNumber: row.so_number,
    vendor: row.vendor,
    isActual: row.is_actual,
    createdAt: row.created_at,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { amount, category, subcategory, description, recordDate, poNumber, soNumber, vendor, isActual } = body;

    const row = await queryOne<DbSpendRecord>(
      `UPDATE spend_records SET
        amount = COALESCE($1, amount),
        category = COALESCE($2, category),
        subcategory = COALESCE($3, subcategory),
        description = COALESCE($4, description),
        record_date = COALESCE($5, record_date),
        po_number = COALESCE($6, po_number),
        so_number = COALESCE($7, so_number),
        vendor = COALESCE($8, vendor),
        is_actual = COALESCE($9, is_actual)
       WHERE id = $10
       RETURNING *`,
      [amount ?? null, category, subcategory || null, description || null, recordDate || null, poNumber || null, soNumber || null, vendor || null, isActual ?? null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapSpendRecord(row));
  } catch (error) {
    console.error('PATCH /api/spend-records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update spend record' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM spend_records WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/spend-records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete spend record' }, { status: 500 });
  }
}
