import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbHeadcountTarget {
  id: string;
  business_unit_id: string;
  competence_id: string | null;
  role_category: string | null;
  target_fte: number;
  effective_quarter: number;
  effective_year: number;
  notes: string | null;
}

function mapHeadcountTarget(row: DbHeadcountTarget) {
  return {
    id: row.id,
    businessUnitId: row.business_unit_id,
    competenceId: row.competence_id,
    roleCategory: row.role_category,
    targetFte: row.target_fte,
    effectiveQuarter: row.effective_quarter,
    effectiveYear: row.effective_year,
    notes: row.notes,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessUnitId = searchParams.get('businessUnitId');
  const year = searchParams.get('year');

  try {
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (businessUnitId) {
      values.push(businessUnitId);
      conditions.push(`business_unit_id = $${values.length}`);
    }
    if (year) {
      values.push(parseInt(year, 10));
      conditions.push(`effective_year = $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<DbHeadcountTarget>(
      `SELECT * FROM headcount_targets ${where} ORDER BY effective_year ASC, effective_quarter ASC`,
      values
    );
    return NextResponse.json(rows.map(mapHeadcountTarget));
  } catch (error) {
    console.error('GET /api/headcount-targets error:', error);
    return NextResponse.json({ error: 'Failed to fetch headcount targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessUnitId, competenceId, roleCategory, targetFte, effectiveQuarter, effectiveYear, notes } = body;

    if (!businessUnitId || targetFte === undefined || targetFte === null || !effectiveQuarter || !effectiveYear) {
      return NextResponse.json(
        { error: 'businessUnitId, targetFte, effectiveQuarter, and effectiveYear are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const row = await query<DbHeadcountTarget>(
      `INSERT INTO headcount_targets (id, business_unit_id, competence_id, role_category, target_fte, effective_quarter, effective_year, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, businessUnitId, competenceId || null, roleCategory || null, targetFte, effectiveQuarter, effectiveYear, notes || null]
    );

    return NextResponse.json(mapHeadcountTarget(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/headcount-targets error:', error);
    return NextResponse.json({ error: 'Failed to create headcount target' }, { status: 500 });
  }
}
