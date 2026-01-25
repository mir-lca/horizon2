import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const resources = await query(`
      SELECT id::text,
             competence_id::text AS "competenceId",
             competence_name AS "competenceName",
             quantity,
             yearly_wage AS "yearlyWage",
             business_unit_id::text AS "businessUnitId",
             business_unit_name AS "businessUnitName",
             skills,
             name,
             is_ai AS "isAI"
      FROM resources
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
    const payload = await request.json();

    if (!payload.competenceId) {
      return NextResponse.json(
        { error: 'Competence is required' },
        { status: 400 }
      );
    }

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
