import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('userEmail');

  try {
    const rows = await query<DbNotification>(
      userEmail
        ? 'SELECT * FROM notifications WHERE user_email = $1 ORDER BY created_at DESC LIMIT 50'
        : 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50',
      userEmail ? [userEmail] : []
    );
    return NextResponse.json(rows.map(mapNotification));
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, title, message, entityType, entityId } = body;

    if (!userEmail || !title || !message) {
      return NextResponse.json({ error: 'userEmail, title, and message are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbNotification>(
      `INSERT INTO notifications (id, user_email, title, message, entity_type, entity_id, read)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [id, userEmail, title, message, entityType || null, entityId || null]
    );

    return NextResponse.json(mapNotification(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
