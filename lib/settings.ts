import fs from 'fs';
import path from 'path';

export interface SiteSettings {
  hero: {
    image: string;       // 图片 URL
    title: string;
    subtitle: string;
  };
  updatedAt: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    image: '',
    title: '捕捉灵感光影，重塑数字美学。',
    subtitle: '欢迎来到 Actum 的视觉空间。我们致力于将前沿技术与突破性设计深度融合，在克制与张力之间，创造直击人心的交互范式与视觉体验。',
  },
  updatedAt: new Date().toISOString(),
};

const dataFilePath = path.join(process.cwd(), 'data', 'settings.json');

export function getSettings(): SiteSettings {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SiteSettings): SiteSettings {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataFilePath, JSON.stringify(settings, null, 2));
  return settings;
}
