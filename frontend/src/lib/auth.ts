import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';

export interface UserPermissions {
  userId: string;
  roles: string[];
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
}

// Get user ID from request headers (Azure Static Web Apps sets x-ms-client-principal-name)
export function getUserId(request: NextRequest): string {
  return (
    request.headers.get('x-ms-client-principal-name') ||
    request.headers.get('x-user-id') ||
    'anonymous'
  );
}

export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  if (userId === 'anonymous') {
    return { userId, roles: ['viewer'], canRead: true, canWrite: false, canAdmin: false };
  }

  const rows = await query<{ name: string }>(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  ).catch(() => []);

  const roles = rows.length > 0 ? rows.map((r) => r.name) : ['viewer'];

  return {
    userId,
    roles,
    canRead: true,
    canWrite: roles.some((r) => ['editor', 'portfolio_manager', 'admin'].includes(r)),
    canAdmin: roles.includes('admin'),
  };
}

type RouteHandler = (request: NextRequest, context: any) => Promise<NextResponse>;

// Wrapper that enforces write permission for mutating methods
export function withAuth(handler: RouteHandler, requireWrite = false): RouteHandler {
  return async (request: NextRequest, context: any) => {
    const userId = getUserId(request);
    const perms = await getUserPermissions(userId);

    if (requireWrite && !perms.canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(request, context);
  };
}
