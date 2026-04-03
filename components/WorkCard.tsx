import Image from 'next/image';

interface WorkImage {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface Work {
  id: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  coverWidth?: number;
  coverHeight?: number;
  images: WorkImage[];
  createdAt: string;
}

interface WorkCardProps {
  work: Work;
  onClick?: () => void;
}

export default function WorkCard({ work, onClick }: WorkCardProps) {
  const coverW = work.coverWidth || work.images[0]?.width || 800;
  const coverH = work.coverHeight || work.images[0]?.height || 600;

  return (
    <div className="masonry-item group cursor-pointer" onClick={onClick}>
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300">
        <div
          className="relative w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
          style={{ aspectRatio: `${coverW} / ${coverH}` }}
        >
          <Image
            src={work.coverImage}
            alt={work.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium">
                查看详情
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
            {work.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {work.category}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {work.description}
          </p>
        </div>
      </div>
    </div>
  );
}
