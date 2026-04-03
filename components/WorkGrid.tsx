'use client';

import { useState } from 'react';
import WorkCard from './WorkCard';
import ImageModal from './ImageModal';

interface Work {
  id: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  coverWidth?: number;
  coverHeight?: number;
  images: Array<{
    id: number;
    src: string;
    alt: string;
    width: number;
    height: number;
  }>;
  createdAt: string;
}

export default function WorkGrid({ works }: { works: Work[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['全部', ...Array.from(new Set(works.map((work) => work.category)))];

  const filteredWorks = works.filter((work) => {
    const matchesCategory = selectedCategory === '全部' || work.category === selectedCategory;
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          work.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="搜索作品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 作品网格 */}
      {filteredWorks.length > 0 ? (
        <div className="masonry-grid">
          {filteredWorks.map((work) => (
            <WorkCard 
              key={work.id} 
              work={work}
              onClick={() => setSelectedWork(work)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">没有找到匹配的作品</p>
        </div>
      )}

      {/* 图片模态框 */}
      {selectedWork && (
        <ImageModal 
          work={selectedWork} 
          onClose={() => setSelectedWork(null)} 
        />
      )}
    </div>
  );
}
