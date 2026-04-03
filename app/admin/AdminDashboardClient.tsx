'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Eye, Save } from 'lucide-react';

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
  images: WorkImage[];
  createdAt: string;
  order: number;
}

interface SortableItemProps {
  work: Work;
  onDelete: (id: string) => void;
}

function SortableWorkItem({ work, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${
        isDragging ? 'opacity-50 shadow-xl z-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        title="拖拽排序"
      >
        <GripVertical size={20} />
      </button>

      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={work.coverImage}
          alt={work.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {work.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {work.category}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {new Date(work.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/work/${work.id}`}
          className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          title="查看"
        >
          <Eye size={16} />
        </Link>
        <button
          onClick={() => onDelete(work.id)}
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardClient() {
  const { data: session, status } = useSession() || {};
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchWorks = useCallback(async () => {
    try {
      const res = await fetch('/api/works');
      const data = await res.json();
      setWorks(data);
    } catch (error) {
      console.error('Failed to fetch works:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？')) return;

    try {
      const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorks((prev) => prev.filter((work) => work.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete work:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWorks((items) => {
        const oldIndex = items.findIndex((w) => w.id === active.id);
        const newIndex = items.findIndex((w) => w.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const orderedIds = works.map((w) => w.id);
      await fetch('/api/works/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      alert('排序已保存！');
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            管理后台
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存排序'}
            </button>
            <Link
              href="/admin/upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              添加新作品
            </Link>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            拖动作品卡片左侧的手柄图标可调整排列顺序，排列完成后点击「保存排序」按钮生效。
          </p>
        </div>

        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={works.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              {works.map((work) => (
                <SortableWorkItem
                  key={work.id}
                  work={work}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {works.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">
                还没有作品，点击上方按钮添加
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
