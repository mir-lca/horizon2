import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const ResourceSchema = z.object({
  competenceId: z.string().uuid("Valid competence ID required"),
  competenceName: z.string().optional(),
  quantity: z.number().min(0).optional(),
  yearlyWage: z.number().min(0).optional(),
  businessUnitId: z.string().uuid().optional().nullable(),
  businessUnitName: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  isAI: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';

  try {
    const resources = await query(`
      SELECT id::text,
             competence_id::text AS "competenceId",
             competence_name AS "competenceName",
             quantity,
             yearly_wage AS "yearlyWage",
             business_unit_id AS "businessUnitId",
             employee_references AS "employeeReferences",
             skills,
             name,
             is_ai AS "isAI",
             archived_at AS "archivedAt"
      FROM resources
      ${includeArchived ? '' : 'WHERE archived_at IS NULL'}
      ORDER BY competence_name
    `);

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = ResourceSchema.parse(body);

    const resourceId = randomUUID();

    await execute(
      `
      INSERT INTO resources (
        id,
        competence_id,
        competence_name,
        quantity,
        yearly_wage,
        business_unit_id,
        business_unit_name,
        skills,
        name,
        is_ai
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        resourceId,
        payload.competenceId,
        payload.competenceName || null,
        payload.quantity || 1,
        payload.yearlyWage || null,
        payload.businessUnitId || null,
        payload.businessUnitName || null,
        payload.skills || null,
        payload.name || null,
        payload.isAI || false,
      ]
    );

    return NextResponse.json({ id: resourceId }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
