import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbUserRole {
  id: string;
  user_email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

function mapUserRole(row: DbUserRole) {
  return {
    id: row.id,
    userEmail: row.user_email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const rows = await query<DbUserRole>('SELECT * FROM user_roles ORDER BY created_at ASC', []);
    return NextResponse.json(rows.map(mapUserRole));
  } catch (error) {
    console.error('GET /api/user-roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, displayName, role } = body;

    if (!userEmail || !role) {
      return NextResponse.json({ error: 'userEmail and role are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbUserRole>(
      `INSERT INTO user_roles (id, user_email, display_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_email) DO UPDATE SET role = $4, display_name = $3
       RETURNING *`,
      [id, userEmail, displayName || null, role]
    );

    return NextResponse.json(mapUserRole(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/user-roles error:', error);
    return NextResponse.json({ error: 'Failed to create user role' }, { status: 500 });
  }
}
