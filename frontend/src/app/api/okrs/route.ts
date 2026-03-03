import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbOkr {
  id: string;
  title: string;
  description: string | null;
  type: string;
  parent_id: string | null;
  owner: string | null;
  target_value: number | null;
  unit: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

function mapOkr(row: DbOkr) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    parentId: row.parent_id,
    owner: row.owner,
    targetValue: row.target_value,
    unit: row.unit,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export async function GET() {
  try {
    const rows = await query<DbOkr>('SELECT * FROM okrs ORDER BY type, title');
    return NextResponse.json(rows.map(mapOkr));
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type = 'objective', parentId, owner, targetValue, unit, startDate, endDate } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbOkr>(
      'INSERT INTO okrs (id,title,description,type,parent_id,owner,target_value,unit,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [id, title, description ?? null, type, parentId ?? null, owner ?? null, targetValue ?? null, unit ?? null, startDate ?? null, endDate ?? null]
    );
    return NextResponse.json(mapOkr(row[0]), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
