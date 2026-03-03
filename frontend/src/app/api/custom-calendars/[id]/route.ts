import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

interface DbCustomCalendar {
  id: string;
  name: string;
  year: number;
  blackout_dates: unknown;
  created_by: string | null;
  created_at: string;
}

function mapCustomCalendar(row: DbCustomCalendar) {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    blackoutDates: row.blackout_dates,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbCustomCalendar>(
      'SELECT * FROM custom_calendars WHERE id = $1',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCustomCalendar(row));
  } catch (error) {
    console.error('GET /api/custom-calendars/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom calendar' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, year, blackoutDates, createdBy } = body;

    const row = await queryOne<DbCustomCalendar>(
      `UPDATE custom_calendars SET
        name = COALESCE($1, name),
        year = COALESCE($2, year),
        blackout_dates = COALESCE($3, blackout_dates),
        created_by = COALESCE($4, created_by)
       WHERE id = $5
       RETURNING *`,
      [name || null, year ?? null, blackoutDates !== undefined ? JSON.stringify(blackoutDates) : null, createdBy || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCustomCalendar(row));
  } catch (error) {
    console.error('PUT /api/custom-calendars/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update custom calendar' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM custom_calendars WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/custom-calendars/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete custom calendar' }, { status: 500 });
  }
}
