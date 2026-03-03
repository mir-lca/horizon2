import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

interface DbNotification {
  id: string;
  user_email: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

function mapNotification(row: DbNotification) {
  return {
    id: row.id,
    userEmail: row.user_email,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await queryOne<DbNotification>(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapNotification(row));
  } catch (error) {
    console.error('PUT /api/notifications/[id]/read error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
