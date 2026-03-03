import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    await execute('UPDATE notifications SET read = true WHERE user_email = $1', [userEmail]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/notifications/read-all error:', error);
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
  }
}
