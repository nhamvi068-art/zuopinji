'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

export default function WorkDetail({ work }: { work: Work }) {
  const [selectedImage, setSelectedImage] = useState(0);

  const allImages = [
    { id: 0, src: work.coverImage, alt: work.title, width: 800, height: 600 },
    ...work.images,
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回作品集
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-[500px] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <Image
                src={allImages[selectedImage].src}
                alt={allImages[selectedImage].alt}
                fill
                className="object-contain"
              />
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              {allImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === index ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {work.title}
              </h1>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {work.category}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {work.description}
              </p>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  项目信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">创建时间</span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">图片数量</span>
                    <p className="text-gray-900 dark:text-white">{allImages.length} 张</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
