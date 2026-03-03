import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbDef {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: unknown;
  applies_to: string[];
  required: boolean;
  sort_order: number;
}

function mapDef(row: DbDef) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    fieldType: row.field_type,
    options: row.options,
    appliesTo: row.applies_to ?? [],
    required: row.required,
    sortOrder: row.sort_order,
  };
}

export async function GET() {
  try {
    const rows = await query<DbDef>('SELECT * FROM custom_attribute_definitions ORDER BY sort_order, label');
    return NextResponse.json(rows.map(mapDef));
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label, fieldType, options, appliesTo = ['project'], required = false, sortOrder = 0 } = body;
    if (!key || !label || !fieldType) return NextResponse.json({ error: 'key, label, fieldType required' }, { status: 400 });
    const id = uuidv4();
    const row = await query<DbDef>(
      'INSERT INTO custom_attribute_definitions (id,key,label,field_type,options,applies_to,required,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (key) DO UPDATE SET label=$3,field_type=$4,options=$5,applies_to=$6,required=$7,sort_order=$8 RETURNING *',
      [id, key, label, fieldType, options ? JSON.stringify(options) : null, appliesTo, required, sortOrder]
    );
    return NextResponse.json(mapDef(row[0]), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
