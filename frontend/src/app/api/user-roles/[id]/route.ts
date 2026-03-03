import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbUserRole>('SELECT * FROM user_roles WHERE id = $1', [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapUserRole(row));
  } catch (error) {
    console.error('GET /api/user-roles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { userEmail, displayName, role } = body;

    const row = await queryOne<DbUserRole>(
      `UPDATE user_roles SET
        user_email = COALESCE($1, user_email),
        display_name = COALESCE($2, display_name),
        role = COALESCE($3, role)
       WHERE id = $4
       RETURNING *`,
      [userEmail || null, displayName || null, role || null, id]
    );

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapUserRole(row));
  } catch (error) {
    console.error('PUT /api/user-roles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM user_roles WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/user-roles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete user role' }, { status: 500 });
  }
}
