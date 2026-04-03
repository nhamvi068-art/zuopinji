import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import UploadForm from './UploadForm';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <UploadForm />;
}
