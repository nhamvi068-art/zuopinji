'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Plus, LayoutGrid, Image as ImageIcon, ChevronLeft, Download,
  Heart, Minus, Maximize2, Lock, Trash2, Pencil, Upload, X, Menu,
} from 'lucide-react';
import LoginModal from './LoginModal';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

interface WorkImage {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  thumb?: string;
  blurDataURL?: string;
}

interface Work {
  id: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  coverWidth?: number;
  coverHeight?: number;
  coverThumb?: string;
  coverBlurDataURL?: string;
  images: WorkImage[];
  createdAt: string;
}

interface AllImage {
  id: string;
  workId: string;
  workTitle: string;
  title: string;
  src: string;
  thumb?: string;
  blurDataURL?: string;
  width: number;
  height: number;
}

// ─── SSR Props 类型 ──────────────────────────────────────────────────────────

interface HomePageProps {
  initialWorks?: Work[];
  initialSettings?: SiteSettings;
}

interface SiteSettings {
  hero: { image: string; title: string; subtitle: string };
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const getAllImages = (works: Work[]): AllImage[] => {
  const out: AllImage[] = [];
  works.forEach((work) => {
    const coverW = work.coverWidth || work.images[0]?.width || 800;
    const coverH = work.coverHeight || work.images[0]?.height || 600;
    out.push({
      id: `${work.id}-cover`,
      workId: work.id,
      workTitle: work.title,
      title: work.title,
      src: work.coverImage,
      thumb: work.coverThumb || work.coverImage,
      blurDataURL: work.coverBlurDataURL,
      width: coverW,
      height: coverH,
    });
    work.images.forEach((img, idx) => {
      out.push({
        id: `${work.id}-${img.id}`,
        workId: work.id,
        workTitle: work.title,
        title: img.alt || `${work.title} - ${idx + 1}`,
        src: img.src,
        thumb: img.thumb || img.src,
        blurDataURL: img.blurDataURL,
        width: img.width,
        height: img.height,
      });
    });
  });
  return out;
};

// 根据当前容器宽度，将一维图片列表切分为「行」
// 每行宽度（gap 累计）不超过 containerWidth，每张图宽度 = height * aspectRatio
const buildRows = (
  images: AllImage[],
  containerWidth: number,
  thumbHeight: number,
  gap: number,
  padding: number,
): { items: AllImage[]; width: number }[] => {
  if (!images.length || containerWidth <= 0) return [];
  const rows: { items: AllImage[]; width: number }[] = [];
  let i = 0;
  while (i < images.length) {
    const usable = containerWidth - padding * 2;
    const row: AllImage[] = [];
    let rowWidth = 0;
    while (i < images.length) {
      const img = images[i];
      const scaledW = Math.round(thumbHeight * (img.width / img.height));
      const nextWidth = row.length === 0 ? scaledW : rowWidth + gap + scaledW;
      if (nextWidth > usable && row.length > 0) break;
      row.push(img);
      rowWidth = nextWidth;
      i++;
    }
    rows.push({ items: row, width: rowWidth });
  }
  return rows;
};

// ─── 常量 ────────────────────────────────────────────────────────────────────

const THUMB_SIZES = {
  small:  { label: '小',  height: 150, icon: <Minus size={13} /> },
  medium: { label: '中',  height: 250, icon: <LayoutGrid size={14} /> },
  large:  { label: '大',  height: 350, icon: <Maximize2 size={14} /> },
} as const;
type ThumbKey = keyof typeof THUMB_SIZES;

// ─── TopNavigation ───────────────────────────────────────────────────────────

const TopNavigation = ({
  onBack, currentView, isLoggedIn, onLoginClick, onLogout,
}: {
  onBack: () => void;
  currentView: string;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
}) => (
  <nav className="flex justify-between items-center px-4 md:px-6 py-2 bg-[#0A0A0A] text-white border-b border-zinc-800/60 shrink-0">
    <div className="flex items-center gap-2 md:gap-4">
      {currentView === 'workspace' && (
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors" title="返回主页">
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="font-bold text-lg md:text-xl tracking-widest uppercase cursor-pointer" onClick={onBack}>Actum</div>
    </div>
    <div className="flex items-center gap-2 md:gap-4">
      {isLoggedIn ? (
        <button onClick={onLogout}
          className="px-3 md:px-5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-red-600 border border-zinc-800 hover:border-red-500 rounded-full transition-all">
          退出
        </button>
      ) : (
        <button onClick={onLoginClick}
          className="px-3 md:px-5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-full transition-all flex items-center gap-1.5">
          <Lock size={12} /><span className="hidden sm:inline">登录</span>
        </button>
      )}
    </div>
  </nav>
);

// ─── HomeView ────────────────────────────────────────────────────────────────

const HomeView = ({
  works, onSelectProject, isLoggedIn, onAddProject, settings, onDeleteProject, onEditHero,
}: {
  works: Work[];
  onSelectProject: (project: { id: string; name: string; count: number; cover: string }) => void;
  isLoggedIn: boolean;
  onAddProject: () => void;
  settings: SiteSettings;
  onDeleteProject: (id: string) => void;
  onEditHero: () => void;
}) => {
  const allImages = getAllImages(works);
  const projects = works.map(work => ({
    id: work.id, name: work.title, category: work.category,
    count: work.images.length + 1, cover: work.coverImage,
  }));
  const heroBg = settings.hero.image || allImages[0]?.src
    || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2000&auto=format&fit=crop';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A] pb-8 scrollbar-hide">
      <div className="px-3 md:px-6 py-2">
        <div className="relative w-full h-[40vh] md:h-[55vh] rounded-xl md:rounded-2xl overflow-hidden group">
          <img src={heroBg} alt="Hero"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {isLoggedIn && (
            <button onClick={onEditHero}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-black/60 hover:bg-blue-600 text-white rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
              title="编辑海报">
              <Pencil size={16} /><span className="text-sm font-medium hidden md:inline">编辑海报</span>
            </button>
          )}
          <div className="absolute bottom-8 md:bottom-16 left-4 md:left-12 max-w-lg z-10">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold mb-3 md:mb-5 leading-tight tracking-tight text-white drop-shadow-lg">
              {settings.hero.title.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
            </h1>
            <p className="text-zinc-200 text-xs md:text-sm leading-relaxed max-w-xs md:max-w-md drop-shadow-md line-clamp-2 md:line-clamp-none">
              {settings.hero.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 mt-8 md:mt-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-white text-lg md:text-xl font-medium px-2 tracking-wide">精选作品集</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 px-0 md:px-2">
          {isLoggedIn && (
            <div onClick={onAddProject}
              className="group cursor-pointer flex flex-col items-center justify-center bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 border-dashed rounded-xl md:rounded-xl aspect-[4/3] transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center mb-2 md:mb-3 transition-colors">
                <Plus className="text-zinc-400 group-hover:text-white" />
              </div>
              <span className="text-zinc-400 group-hover:text-white font-medium text-xs md:text-sm">新建项目</span>
            </div>
          )}
          {projects.map(project => (
            <div key={project.id}
              className="group relative cursor-pointer rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all active:scale-95"
              onClick={() => onSelectProject(project)}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={project.cover} alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {isLoggedIn && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1"
                    title="删除项目">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="p-2 md:p-4">
                <h3 className="text-white font-medium text-xs md:text-sm truncate">{project.name}</h3>
                <p className="text-zinc-500 text-[10px] md:text-xs mt-0.5 md:mt-1">{project.count} 项</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── AddProjectModal ─────────────────────────────────────────────────────────

const AddProjectModal = ({ isOpen, onClose, onSubmit }: {
  isOpen: boolean; onClose: () => void; onSubmit: (name: string) => void;
}) => {
  const [name, setName] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) { onSubmit(name.trim()); setName(''); onClose(); }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-zinc-700 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-xl font-semibold text-white text-center mb-6">新建项目</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="输入项目名称"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            autoFocus />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">取消</button>
            <button type="submit" disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">创建</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── HeroEditModal ────────────────────────────────────────────────────────────

const HeroEditModal = ({ isOpen, onClose, currentImage, onSave }: {
  isOpen: boolean; onClose: () => void; currentImage: string; onSave: (url: string) => void;
}) => {
  const [preview, setPreview] = useState<string>(currentImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen) setPreview(currentImage); }, [currentImage, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { onClose(); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) { onSave(data.url); onClose(); }
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">编辑海报</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700 transition-colors"><X size={18} /></button>
        </div>
        <div onClick={() => fileInputRef.current?.click()}
          className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border-2 border-dashed border-zinc-600 hover:border-zinc-400 cursor-pointer bg-zinc-800/50 group transition-colors">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            <Upload size={28} className="text-white mb-2" />
            <p className="text-white text-sm font-medium">点击上传新海报</p>
            <p className="text-zinc-300 text-xs mt-1">支持 JPG、PNG、WEBP</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm font-medium">取消</button>
          <button onClick={handleSave} disabled={uploading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? '上传中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

const ConfirmModal = ({
  isOpen, title, message, confirmLabel = '确定', danger, onClose, onConfirm,
}: {
  isOpen: boolean; title?: string; message: string; confirmLabel?: string; danger?: boolean;
  onClose: () => void; onConfirm: () => void | Promise<void>;
}) => {
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const handleConfirm = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative bg-[#1a1a1a] border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        {title && <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>}
        <p className="text-zinc-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6">
          <button disabled={busy} onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50">取消</button>
          <button disabled={busy} onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}>
            {busy ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ImageLightbox ─────────────────────────────────────────────────────────────

// ─── ImageLightbox — 渐进式加载（双层叠加）+ 意图预加载接收 ───────────────────
// image 由 AllImage 类型保证：必含 src/thumb，灯箱打开瞬间底层即显示已缓存的缩略图
const ImageLightbox = ({
  image, onClose,
}: {
  image: AllImage;
  onClose: () => void;
}) => {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  // 每次打开 / 切换图片时重置；高清就绪后卸掉底层，避免 blur+scale 在清晰图背后露虚影
  useEffect(() => {
    setIsHighResLoaded(false);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, image.src]);

  // 两层 img：仅在大图未就绪时渲染底层模糊占位；大图 onLoad 后底层从 DOM 移除，无背后虚影
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 容器：固定宽高，防止大图加载时抖动 */}
      <div
        className="relative max-w-6xl w-full h-[85vh] mx-2 md:mx-8"
        onClick={e => e.stopPropagation()}
      >
        {!isHighResLoaded && (
          <img
            src={image.thumb || image.src}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              filter: 'blur(8px)',
              transform: 'scale(1.05)',
            }}
            aria-hidden="true"
          />
        )}

        {/* ── 高清原图：未加载时透明占位，加载后独占画面 ── */}
        <img
          src={image.src}
          alt={image.title || ''}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
            isHighResLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsHighResLoaded(true)}
        />

        {/* 加载进度指示器（顶层图片仍在加载时显示） */}
        {!isHighResLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full backdrop-blur-sm text-xs md:text-sm max-w-[80vw] truncate">
        {image.title}
      </div>
    </div>
  );
};

// ─── EagleWorkspace — 虚拟滚动版 ──────────────────────────────────────────────

const EagleWorkspace = ({
  project, works, onSwitchProject, onUploadClick, onSelectImage,
  isLoggedIn, onLoginClick, onDeleteImage,
}: {
  project: { id: string; name: string; count: number };
  works: Work[];
  onSwitchProject: (p: { id: string; name: string; count: number; cover: string }) => void;
  onUploadClick: () => void;
  onSelectImage: (image: AllImage) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onDeleteImage: (workId: string, imageId: string) => void;
}) => {
  const work = works.find(w => w.id === project.id);
  const allImages = work ? getAllImages([work]) : [];

  const projects = works.map(w => ({
    id: w.id, name: w.title, count: w.images.length + 1, cover: w.coverImage,
  }));

  // 缩略图尺寸
  const [thumbKey, setThumbKey] = useState<ThumbKey>('medium');
  const thumbHeight = THUMB_SIZES[thumbKey].height;

  // 移动端抽屉 + 选中态
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [selectedImgId, setSelectedImgId] = useState<string | null>(null);

  // 滚动容器 ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // 容器宽度（用于计算每行放几张图）
  const [containerWidth, setContainerWidth] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    setSelectedImgId(null);
  }, [project.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    setContainerWidth(scrollRef.current.clientWidth);

    resizeObserverRef.current = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    resizeObserverRef.current.observe(scrollRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // gap 大小（对应 Tailwind gap-1.5 md:gap-2）
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    setIsMd(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const gap = isMd ? 8 : 6; // px
  const padding = isMd ? 16 : 8; // px

  // 根据当前容器宽度构建所有行
  const rows = useMemo(
    () => buildRows(allImages, containerWidth, thumbHeight, gap, padding),
    [allImages, containerWidth, thumbHeight, gap, padding],
  );

  // 行高 = thumbHeight + gap（最后一行不需要底部 gap，但统一值便于 virtualizer 计算）
  const rowHeight = thumbHeight + gap;

  // ── useVirtualizer ───────────────────────────────────────────────────────
  // count: 总行数；estimateSize: 估算行高（实际偏移由 measureElement 测量）
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 3, // 视口外额外渲染 3 行，防止快速滚动白屏
  });

  // 单击直接打开灯箱（蓝色边框保留，"last selected"视觉指示）
  const handleImgClick = useCallback((img: AllImage) => {
    setSelectedImgId(img.id);
    onSelectImage(img);
  }, [onSelectImage]);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#121212] text-zinc-300">
      {/* ── 左侧边栏 (desktop) ── */}
      <div className="hidden lg:flex w-64 bg-[#0A0A0A] border-r border-zinc-800/60 flex-col shrink-0">
        <div className="h-14 shrink-0 flex items-center px-4 border-b border-zinc-800/60">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider leading-none">精选作品集</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          <div className="px-2 space-y-1">
            {projects.map(p => (
              <button key={p.id} onClick={() => onSwitchProject(p)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                  p.id === project.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}>
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-zinc-700">
                  <img src={p.cover} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-zinc-600">{p.count} 项</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 移动端抽屉 ── */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-zinc-800/60 flex flex-col">
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-zinc-800/60">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider leading-none">精选作品集</p>
              <button onClick={() => setShowMobileDrawer(false)} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
              <div className="px-2 space-y-1">
                {projects.map(p => (
                  <button key={p.id} onClick={() => { onSwitchProject(p); setShowMobileDrawer(false); }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                      p.id === project.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}>
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-zinc-700">
                      <img src={p.cover} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-600">{p.count} 项</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 主内容区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-14 shrink-0 border-b border-zinc-800/60 bg-[#0A0A0A]/50 flex items-center px-3 md:px-6 backdrop-blur-md gap-3">
          <button onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors" title="切换项目">
            <Menu size={20} />
          </button>
          <div className="min-w-0 shrink flex flex-col justify-center gap-0.5 flex-1">
            <h2 className="text-white font-medium truncate text-sm leading-tight" title={project.name}>{project.name}</h2>
            <p className="text-zinc-500 text-xs leading-none">{allImages.length} 个素材</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex items-center bg-zinc-900 rounded-md border border-zinc-800 p-0.5 gap-0.5">
              {(Object.keys(THUMB_SIZES) as ThumbKey[]).map((key) => {
                const size = THUMB_SIZES[key];
                return (
                  <button key={key} onClick={() => setThumbKey(key)} title={`缩略图${size.label}`}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                      thumbKey === key ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}>
                    {size.icon}
                    <span className="text-[11px] hidden sm:inline">{size.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="w-px h-4 bg-zinc-800 hidden sm:block"></div>
            {isLoggedIn ? (
              <button onClick={onUploadClick}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5">
                <Plus size={16} /><span className="hidden sm:inline">导入</span>
              </button>
            ) : (
              <button onClick={onLoginClick}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5">
                <Lock size={14} /><span className="hidden sm:inline">登录后导入</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 虚拟滚动网格 ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#0E0E0E] scrollbar-hide">
          {allImages.length > 0 ? (
            // virtualizer 根容器：position: relative 是必须的（absolute 子项参照它定位）
            <div
              style={{
                position: 'relative',
                width: '100%',
                // 总高度 = 最后一行起始偏移 + 最后一行高度
                height: `${virtualizer.getTotalSize()}px`,
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const { items: rowItems, width: rowWidth } = rows[virtualRow.index];
                // 该行在容器内的实际偏移（top）
                const rowTop = virtualRow.start;

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    // ref 供 virtualizer 测量实际偏移（已在 start 里，但这里显式声明更规范）
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${rowTop}px)`,
                    }}
                  >
                    {/* 行内图片：flex 布局，水平居左 */}
                    <div
                      className="flex gap-1.5 md:gap-2 content-start items-start"
                      style={{
                        paddingLeft: padding,
                        paddingRight: padding,
                        paddingTop: gap / 2,
                        height: thumbHeight + gap,
                      }}
                    >
                      {rowItems.map((img) => {
                        const isSelected = selectedImgId === img.id;
                        const scaledW = Math.round(thumbHeight * (img.width / img.height));
                        return (
                          <div
                            key={img.id}
                            className="cursor-pointer shrink-0"
                            onClick={() => handleImgClick(img)}
                            onMouseEnter={() => {
                              // 意图预加载：用户悬停即开始下载原图
                              // 浏览器 HTTP 缓存生效时，点击瞬间图片已在本地，零延迟展示
                              const preload = new globalThis.Image();
                              preload.src = img.src;
                            }}
                          >
                            <div
                              className={`group relative rounded-lg overflow-hidden border transition-all ${
                                isSelected ? 'border-blue-500' : 'border-zinc-800/60 hover:border-zinc-600'
                              }`}
                              style={{
                                height: thumbHeight,
                                width: scaledW,
                                backgroundImage: img.blurDataURL ? `url(${img.blurDataURL})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: '#18181b',
                                contentVisibility: 'auto',
                                transform: 'translateZ(0)',
                              }}
                            >
                              <img
                                src={img.thumb || img.src}
                                alt={img.title || ''}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-opacity duration-300"
                                style={{ opacity: 0 }}
                                onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
                              />
                              {/* 悬浮操作层 */}
                              <div
                                className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col justify-between p-1.5 md:p-2 ${
                                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                <div className="flex justify-end gap-1">
                                  {isLoggedIn && (
                                    <button type="button"
                                      onClick={(e) => { e.stopPropagation(); onDeleteImage(img.workId, img.id); setSelectedImgId(null); }}
                                      className="p-1 bg-black/50 hover:bg-red-600 rounded text-white backdrop-blur-sm transition-colors"
                                      title="删除">
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); onSelectImage(img); }}
                                    className="p-1 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur-sm transition-colors"
                                    title="预览">
                                    <Maximize2 size={12} />
                                  </button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); }}
                                    className="p-1 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur-sm transition-colors">
                                    <Heart size={12} />
                                  </button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); }}
                                    className="p-1 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur-sm transition-colors">
                                    <Download size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>暂无图片</p>
              <p className="text-sm mt-1">{isLoggedIn ? '点击右上角「导入」按钮上传图片' : '登录后即可导入图片'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── HomePage 主组件 ──────────────────────────────────────────────────────────

export default function HomePage({ initialWorks = [], initialSettings }: HomePageProps) {
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [currentView, setCurrentView] = useState<'home' | 'workspace'>('home');
  const [activeProject, setActiveProject] = useState<{ id: string; name: string; count: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<AllImage | null>(null);

  const DEFAULT_SETTINGS: SiteSettings = {
    hero: {
      image: '',
      title: '让好产品，一眼动心',
      subtitle: '专注视觉传达与商业落地的无缝衔接。',
    },
  };
  const [settings, setSettings] = useState<SiteSettings>(
    initialSettings ? { hero: initialSettings.hero } : DEFAULT_SETTINGS,
  );

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showHeroEditModal, setShowHeroEditModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title?: string; message: string; confirmLabel?: string; danger?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // ── 初始化：登录状态来自 localStorage，works/settings 来自 SSR props ──
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    // settings 通过 props 传入，若有更新（如新建项目后）才额外 fetch
    // 改为每次进入 workspace 时检查是否需要刷新 works
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) { console.error('Failed to fetch settings:', error); }
  };

  const fetchWorks = async () => {
    try {
      const res = await fetch('/api/works', { cache: 'no-store' });
      const data = await res.json();
      setWorks(data);
    } catch (error) { console.error('Failed to fetch works:', error); }
  };

  // 当用户从 workspace 切回 home 时，若有变更，重新拉取 works
  // （props 中的 initialWorks 覆盖后，需要主动刷新以反映 CRUD 操作）
  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveProject(null);
    fetchWorks(); // 确保新增/删除后首页同步
  };

  const handleLoginSuccess = () => { setIsLoggedIn(true); };
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleSelectProject = (project: { id: string; name: string; count: number; cover?: string }) => {
    setActiveProject({ id: project.id, name: project.name, count: project.count });
    setCurrentView('workspace');
  };

  const handleSwitchWorkspaceProject = (p: { id: string; name: string; count: number; cover: string }) => {
    setActiveProject({ id: p.id, name: p.name, count: p.count });
  };

  const handleDeleteProject = (id: string) => {
    setConfirmDialog({
      title: '删除项目', message: '确定要删除这个项目吗？删除后无法恢复。',
      confirmLabel: '删除', danger: true,
      onConfirm: async () => {
        try { await fetch(`/api/works/${id}`, { method: 'DELETE' }); await fetchWorks(); }
        catch (error) { console.error('Failed to delete project:', error); }
      },
    });
  };

  const handleDeleteImage = (workId: string, imageId: string) => {
    setConfirmDialog({
      title: '删除图片', message: '确定要删除这张图片吗？',
      confirmLabel: '删除', danger: true,
      onConfirm: async () => {
        try {
          const work = works.find(w => w.id === workId);
          if (!work) return;
          const isCover = imageId === `${workId}-cover`;
          const defaultCover = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800';
          if (isCover) {
            const oldCover = work.coverImage;
            const nextDifferent = work.images.find((im) => im.src !== oldCover);
            const newCover = nextDifferent?.src ?? defaultCover;
            await fetch(`/api/works/${workId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coverImage: newCover }),
            });
          } else {
            await fetch(`/api/works/${workId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ images: work.images.filter((img) => `${workId}-${img.id}` !== imageId) }),
            });
          }
          await fetchWorks();
        } catch (error) { console.error('Failed to delete image:', error); }
      },
    });
  };

  const handleAddProject = async (name: string) => {
    try {
      const res = await fetch('/api/works', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name, category: '默认分类', description: '',
          coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800', images: [],
        }),
      });
      await res.json();
      await fetchWorks();
    } catch (error) { console.error('Failed to create project:', error); }
  };

  const handleSaveHeroImage = async (url: string) => {
    try {
      const updatedSettings = { ...settings, hero: { ...settings.hero, image: url } };
      await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: { image: url } }),
      });
      setSettings(updatedSettings);
    } catch (error) { console.error('Failed to save hero image:', error); }
  };

  // ── handleUpload：保留原有逻辑不变 ────────────────────────────────────────
  const handleUpload = async (files: FileList) => {
    const targetWorkId = activeProject?.id || works[0]?.id;
    if (!targetWorkId) { alert('请先创建一个项目'); return; }
    const TWO_MB = 2 * 1024 * 1024;

    for (const file of Array.from(files)) {
      let fileToUpload: File = file;
      if (file.size > TWO_MB) {
        try {
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 2, maxWidthOrHeight: 2560, useWebWorker: true,
          });
        } catch (err) {
          console.error('Image compression failed, uploading original:', err);
          fileToUpload = file;
        }
      }
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        const work = works.find(w => w.id === targetWorkId);
        if (work) {
          const newImage: WorkImage = {
            id: Date.now() + Math.random(),
            src: uploadData.url,
            alt: file.name,
            width: uploadData.width || 800,
            height: uploadData.height || 600,
          };
          await fetch(`/api/works/${targetWorkId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: [...work.images, newImage] }),
          });
        }
      }
    }
    await fetchWorks();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0A0A0A] font-sans">
      <TopNavigation
        onBack={handleBackToHome}
        currentView={currentView}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {currentView === 'home' ? (
        <HomeView
          works={works}
          onSelectProject={handleSelectProject}
          isLoggedIn={isLoggedIn}
          onAddProject={() => setShowAddProjectModal(true)}
          settings={settings}
          onDeleteProject={handleDeleteProject}
          onEditHero={() => setShowHeroEditModal(true)}
        />
      ) : activeProject ? (
        <EagleWorkspace
          project={activeProject}
          works={works}
          onSwitchProject={handleSwitchWorkspaceProject}
          onUploadClick={() => uploadInputRef.current?.click()}
          onSelectImage={setSelectedImage}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setShowLoginModal(true)}
          onDeleteImage={handleDeleteImage}
        />
      ) : null}

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleUpload(e.target.files); }}
      />

      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm ?? (() => {})}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onSubmit={handleAddProject}
      />

      <HeroEditModal
        isOpen={showHeroEditModal}
        onClose={() => setShowHeroEditModal(false)}
        currentImage={settings.hero.image}
        onSave={handleSaveHeroImage}
      />
    </div>
  );
}
