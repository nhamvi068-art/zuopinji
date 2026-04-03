import fs from 'fs';
import path from 'path';
import HomePage from '@/components/HomePage';
import { getWorks } from '@/lib/works';
import { getSettings } from '@/lib/settings';

// 强制 Next.js 在构建时读取最新数据（无 ISR 缓存，保证内容实时）
export const dynamic = 'force-dynamic';

export default function Home() {
  // 直接在服务端 Node.js 层读取 JSON，跳过 API 路由，减少一次 RTT
  const works = getWorks();
  const settings = getSettings();

  return (
    <HomePage
      initialWorks={works}
      initialSettings={settings}
    />
  );
}
