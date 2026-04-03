import { NextResponse } from 'next/server';
import { getSettings, saveSettings, SiteSettings } from '@/lib/settings';

export async function GET() {
  try {
    return NextResponse.json(getSettings());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: Partial<SiteSettings> = await request.json();
    const current = getSettings();
    const updated: SiteSettings = {
      ...current,
      ...body,
      hero: body.hero ? { ...current.hero, ...body.hero } : current.hero,
      updatedAt: new Date().toISOString(),
    };
    saveSettings(updated);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
