import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

// 注意：认证在服务端通过 getServerSession 完成，勿在此文件直接调用 useSession()
// 以免 Next.js prerender 阶段因 SessionProvider 缺失导致 build 崩溃
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <AdminDashboardClient />;
}
