/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        // 为 public/works/ 下的所有静态图片资源设置极限强缓存
        // max-age=31536000 → 1 年，immutable → 永不重验证
        // 浏览器二次访问时直接读本地磁盘缓存，0ms 加载
        source: '/works/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 静态资源（JS/CSS/字体等）同化长缓存
        // Next.js 构建产物文件名自带内容哈希，本身已 immutable
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
