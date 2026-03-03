import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbCustomCalendar>(
      'SELECT * FROM custom_calendars ORDER BY year DESC, name ASC',
      []
    );
    return NextResponse.json(rows.map(mapCustomCalendar));
  } catch (error) {
    console.error('GET /api/custom-calendars error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom calendars' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, year, blackoutDates, createdBy } = body;

    if (!name || !year) {
      return NextResponse.json({ error: 'name and year are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbCustomCalendar>(
      `INSERT INTO custom_calendars (id, name, year, blackout_dates, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, name, year, JSON.stringify(blackoutDates ?? []), createdBy || null]
    );

    return NextResponse.json(mapCustomCalendar(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/custom-calendars error:', error);
    return NextResponse.json({ error: 'Failed to create custom calendar' }, { status: 500 });
  }
}
