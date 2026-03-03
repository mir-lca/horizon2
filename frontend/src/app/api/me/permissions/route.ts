import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserPermissions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const permissions = await getUserPermissions(userId);
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('GET /api/me/permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
