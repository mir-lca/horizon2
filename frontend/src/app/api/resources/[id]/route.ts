import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

interface DbResource {
  id: string;
  competence_id: string;
  competence_name: string;
  quantity: number;
  yearly_wage: number | null;
  business_unit_id: string | null;
  employee_references: unknown;
  skills: string | null;
  name: string | null;
  is_ai: boolean;
  archived_at: string | null;
}

function mapResource(row: DbResource) {
  return {
    id: row.id,
    competenceId: row.competence_id,
    competenceName: row.competence_name,
    quantity: row.quantity,
    yearlyWage: row.yearly_wage,
    businessUnitId: row.business_unit_id,
    employeeReferences: row.employee_references,
    skills: row.skills,
    name: row.name,
    isAI: row.is_ai,
    archivedAt: row.archived_at,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbResource>('SELECT * FROM resources WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapResource(row));
  } catch (error) {
    console.error('GET /api/resources/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'archive') {
      const row = await queryOne<DbResource>(
        `UPDATE resources SET archived_at = now() WHERE id = $1 RETURNING *`,
        [id]
      );
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(mapResource(row));
    }

    if (action === 'restore') {
      const row = await queryOne<DbResource>(
        `UPDATE resources SET archived_at = NULL WHERE id = $1 RETURNING *`,
        [id]
      );
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(mapResource(row));
    }

    const { competenceId, competenceName, quantity, yearlyWage, businessUnitId, skills, name, isAI } = body;

    const row = await queryOne<DbResource>(
      `UPDATE resources SET
        competence_id = COALESCE($1, competence_id),
        competence_name = COALESCE($2, competence_name),
        quantity = COALESCE($3, quantity),
        yearly_wage = $4,
        business_unit_id = $5,
        skills = $6,
        name = $7,
        is_ai = COALESCE($8, is_ai)
       WHERE id = $9
       RETURNING *`,
      [competenceId, competenceName, quantity, yearlyWage ?? null, businessUnitId ?? null, skills ?? null, name ?? null, isAI, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapResource(row));
  } catch (error) {
    console.error('PUT /api/resources/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}
