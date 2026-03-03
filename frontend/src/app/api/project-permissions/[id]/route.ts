import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM project_permissions WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/project-permissions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project permission' }, { status: 500 });
  }
}
