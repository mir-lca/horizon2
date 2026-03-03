import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const CompetenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  averageSalary: z.number().min(0).optional().nullable()
});

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
    const body = await request.json();
    const payload = CompetenceSchema.parse(body);

    const competenceId = randomUUID();

    await execute(
      `
      INSERT INTO competences (id, name, description, category, average_salary)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        competenceId,
        payload.name,
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
