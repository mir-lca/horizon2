import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const rows = await query<DbSpendRecord>(
      projectId
        ? 'SELECT * FROM spend_records WHERE project_id = $1 ORDER BY record_date DESC, created_at DESC'
        : 'SELECT * FROM spend_records ORDER BY record_date DESC, created_at DESC',
      projectId ? [projectId] : []
    );
    return NextResponse.json(rows.map(mapSpendRecord));
  } catch (error) {
    console.error('GET /api/spend-records error:', error);
    return NextResponse.json({ error: 'Failed to fetch spend records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      amount,
      category,
      subcategory,
      description,
      recordDate,
      poNumber,
      soNumber,
      vendor,
      isActual = false,
    } = body;

    if (!projectId || amount === undefined || !category || !recordDate) {
      return NextResponse.json({ error: 'projectId, amount, category, and recordDate are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbSpendRecord>(
      `INSERT INTO spend_records (id, project_id, amount, category, subcategory, description, record_date, po_number, so_number, vendor, is_actual)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, projectId, amount, category, subcategory || null, description || null, recordDate, poNumber || null, soNumber || null, vendor || null, isActual]
    );

    return NextResponse.json(mapSpendRecord(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/spend-records error:', error);
    return NextResponse.json({ error: 'Failed to create spend record' }, { status: 500 });
  }
}
