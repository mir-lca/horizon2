import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const businessUnits = await query(`
      SELECT id::text,
             name,
             description,
             parent_unit_id::text AS "parentUnitId"
      FROM business_units
      ORDER BY name
    `);

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!payload.name) {
      return NextResponse.json(
        { error: 'Business unit name is required' },
        { status: 400 }
      );
    }

    const businessUnitId = randomUUID();

    await execute(
      `
      INSERT INTO business_units (id, name, description, parent_unit_id)
      VALUES ($1, $2, $3, $4)
      `,
      [
        businessUnitId,
        payload.name.trim(),
        payload.description || null,
        payload.parentUnitId || null,
      ]
    );

    return NextResponse.json({ id: businessUnitId }, { status: 201 });
  } catch (error) {
    console.error('Error creating business unit:', error);
    return NextResponse.json(
      { error: 'Failed to create business unit' },
      { status: 500 }
    );
  }
}
