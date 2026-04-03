'use client';

import { useState, useEffect } from 'react';
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

export default function ImageModal({ work, onClose }: { work: Work; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const allImages = [
    { id: 0, src: work.coverImage, alt: work.title, width: 800, height: 600 },
    ...work.images,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative max-w-6xl w-full">
        <div className="relative h-[70vh] bg-gray-900 rounded-lg overflow-hidden">
          <Image
            src={allImages[selectedImage].src}
            alt={allImages[selectedImage].alt}
            fill
            className="object-contain"
          />
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white mb-2">{work.title}</h2>
          <p className="text-gray-300 mb-4">{work.description}</p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
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

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            上一张
          </button>
          <button
            onClick={() => setSelectedImage((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            下一张
          </button>
        </div>
      </div>
    </div>
  );
}
