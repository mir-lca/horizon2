import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbLabourRate {
  id: string;
  region: string;
  seniority_level: string;
  role_category: string | null;
  rate_per_hour: number;
  currency: string | null;
  effective_date: string;
}

function mapLabourRate(row: DbLabourRate) {
  return {
    id: row.id,
    region: row.region,
    seniorityLevel: row.seniority_level,
    roleCategory: row.role_category,
    ratePerHour: row.rate_per_hour,
    currency: row.currency,
    effectiveDate: row.effective_date,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbLabourRate>(
      'SELECT * FROM labour_rates ORDER BY effective_date DESC, region ASC',
      []
    );
    return NextResponse.json(rows.map(mapLabourRate));
  } catch (error) {
    console.error('GET /api/labour-rates error:', error);
    return NextResponse.json({ error: 'Failed to fetch labour rates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, seniorityLevel, roleCategory, ratePerHour, currency, effectiveDate } = body;

    if (!region || !seniorityLevel || !effectiveDate) {
      return NextResponse.json({ error: 'region, seniorityLevel, and effectiveDate are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbLabourRate>(
      `INSERT INTO labour_rates (id, region, seniority_level, role_category, rate_per_hour, currency, effective_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, region, seniorityLevel, roleCategory || null, ratePerHour ?? null, currency || null, effectiveDate]
    );

    return NextResponse.json(mapLabourRate(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/labour-rates error:', error);
    return NextResponse.json({ error: 'Failed to create labour rate' }, { status: 500 });
  }
}
