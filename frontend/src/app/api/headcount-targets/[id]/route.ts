import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbHeadcountTarget>(
      'SELECT * FROM headcount_targets WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapHeadcountTarget(row));
  } catch (error) {
    console.error('GET /api/headcount-targets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch headcount target' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { businessUnitId, competenceId, roleCategory, targetFte, effectiveQuarter, effectiveYear, notes } = body;

    const row = await queryOne<DbHeadcountTarget>(
      `UPDATE headcount_targets SET
        business_unit_id = COALESCE($1, business_unit_id),
        competence_id = COALESCE($2, competence_id),
        role_category = COALESCE($3, role_category),
        target_fte = COALESCE($4, target_fte),
        effective_quarter = COALESCE($5, effective_quarter),
        effective_year = COALESCE($6, effective_year),
        notes = COALESCE($7, notes)
       WHERE id = $8
       RETURNING *`,
      [businessUnitId || null, competenceId || null, roleCategory || null, targetFte ?? null, effectiveQuarter ?? null, effectiveYear ?? null, notes || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapHeadcountTarget(row));
  } catch (error) {
    console.error('PUT /api/headcount-targets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update headcount target' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM headcount_targets WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/headcount-targets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete headcount target' }, { status: 500 });
  }
}
