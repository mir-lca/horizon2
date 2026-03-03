import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { region, seniorityLevel, roleCategory, ratePerHour, currency, effectiveDate } = body;

    const row = await queryOne<DbLabourRate>(
      `UPDATE labour_rates SET
        region = COALESCE($1, region),
        seniority_level = COALESCE($2, seniority_level),
        role_category = COALESCE($3, role_category),
        rate_per_hour = COALESCE($4, rate_per_hour),
        currency = COALESCE($5, currency),
        effective_date = COALESCE($6, effective_date)
       WHERE id = $7
       RETURNING *`,
      [region, seniorityLevel, roleCategory || null, ratePerHour ?? null, currency || null, effectiveDate || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapLabourRate(row));
  } catch (error) {
    console.error('PATCH /api/labour-rates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update labour rate' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM labour_rates WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/labour-rates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete labour rate' }, { status: 500 });
  }
}
