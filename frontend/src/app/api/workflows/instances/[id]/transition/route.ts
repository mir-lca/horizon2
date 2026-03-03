import { NextRequest, NextResponse } from 'next/server';
import { transitionWorkflow } from '@/lib/workflow';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { toState, actor = 'user', comment } = body;
    if (!toState) return NextResponse.json({ error: 'toState required' }, { status: 400 });
    const instance = await transitionWorkflow(id, toState, actor, comment);
    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('POST /api/workflows/instances/[id]/transition error:', error);
    return NextResponse.json({ error: error.message ?? 'Failed' }, { status: 500 });
  }
}
