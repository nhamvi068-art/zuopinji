import { getWorks } from '@/lib/works';
import WorkDetail from '@/components/WorkDetail';
import { notFound } from 'next/navigation';

export default function WorkPage({ params }: { params: { slug: string } }) {
  const works = getWorks();
  const work = works.find((w) => w.id === params.slug);

  if (!work) {
    notFound();
  }

  return <WorkDetail work={work} />;
}
