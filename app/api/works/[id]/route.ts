import { NextRequest, NextResponse } from 'next/server';
import { deleteWork, updateWork } from '@/lib/works';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const works = deleteWork(params.id);
    return NextResponse.json(works);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const works = updateWork(params.id, body);
    return NextResponse.json(works);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}
