import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const competences = await query(`
      SELECT id::text,
             name,
             description,
             category,
             average_salary AS "averageSalary"
      FROM competences
      ORDER BY name
    `);

    return NextResponse.json(competences);
  } catch (error) {
    console.error('Error fetching competences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!payload.name) {
      return NextResponse.json(
        { error: 'Competence name is required' },
        { status: 400 }
      );
    }

    const competenceId = randomUUID();

    await execute(
      `
      INSERT INTO competences (id, name, description, category, average_salary)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        competenceId,
        payload.name.trim(),
        payload.description || null,
        payload.category || null,
        payload.averageSalary || null,
      ]
    );

    return NextResponse.json({ id: competenceId }, { status: 201 });
  } catch (error) {
    console.error('Error creating competence:', error);
    return NextResponse.json(
      { error: 'Failed to create competence' },
      { status: 500 }
    );
  }
}
