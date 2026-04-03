import { NextRequest, NextResponse } from 'next/server';
import { reorderWorks } from '@/lib/works';

export async function PUT(request: NextRequest) {
  try {
    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
    }
    const works = reorderWorks(orderedIds);
    return NextResponse.json(works);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder works' }, { status: 500 });
  }
}
