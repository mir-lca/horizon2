import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await execute('DELETE FROM resource_skills WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/resource-skills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete resource skill' }, { status: 500 });
  }
}
