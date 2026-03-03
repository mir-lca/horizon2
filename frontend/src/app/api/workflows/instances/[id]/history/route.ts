import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowHistory } from '@/lib/workflow';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const history = await getWorkflowHistory(id);
    return NextResponse.json(history);
  } catch (error) {
    console.error('GET /api/workflows/instances/[id]/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
