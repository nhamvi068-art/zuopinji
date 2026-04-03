import { NextRequest, NextResponse } from 'next/server';
import { getWorks, addWork } from '@/lib/works';
import { Work } from '@/lib/works';

export async function GET() {
  try {
    const works = getWorks();
    return NextResponse.json(works);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const allWorks = getWorks();
    const maxOrder = allWorks.length > 0 ? Math.max(...allWorks.map((w) => w.order)) : 0;
    const newWork: Work = {
      id: Date.now().toString(),
      title: body.title,
      category: body.category,
      description: body.description,
      coverImage: body.coverImage,
      images: body.images || [],
      createdAt: new Date().toISOString(),
      order: maxOrder + 1,
    };

    const updated = addWork(newWork);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add work' }, { status: 500 });
  }
}
