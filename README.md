# 亚马逊渲染作品集网站

一个现代化的作品集网站，采用类似 Behance 的瀑布流布局，用于展示亚马逊产品渲染图和设计图。

## 功能特点

- **瀑布流布局** - 类似 Behance 的现代瀑布流网格展示
- **分类筛选** - 支持按分类筛选作品
- **搜索功能** - 快速搜索作品
- **图片灯箱** - 点击图片放大预览，支持多图切换
- **密码保护** - 管理后台需要密码登录，只有你能修改
- **响应式设计** - 完美适配桌面端和移动端
- **暗色模式** - 支持暗色主题切换

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **认证**: NextAuth.js
- **图片处理**: Next.js Image

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
ADMIN_PASSWORD=your-secure-password
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 访问管理后台

1. 点击导航栏的"登录"
2. 输入密码（当前: hybzan5432）
3. 进入管理后台添加/删除作品

## 项目结构

```
portfolio/
├── app/
│   ├── page.tsx              # 首页
│   ├── work/[slug]/page.tsx  # 作品详情页
│   ├── login/page.tsx        # 登录页
│   ├── admin/
│   │   ├── page.tsx          # 管理后台
│   │   └── upload/page.tsx   # 上传新作品
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── works/
│       └── upload/
├── components/
│   ├── Navbar.tsx            # 导航栏
│   ├── Hero.tsx              # 首页横幅
│   ├── WorkGrid.tsx          # 瀑布流组件
│   ├── WorkCard.tsx          # 作品卡片
│   ├── ImageModal.tsx         # 图片预览模态框
│   └── WorkDetail.tsx        # 作品详情组件
├── lib/
│   ├── works.ts              # 作品数据操作
│   └── auth.ts               # 认证配置
└── data/
    └── works.json            # 作品数据存储
```

## 部署到 Vercel

1. 在 [Vercel](https://vercel.com) 创建新项目
2. 连接你的 GitHub 仓库
3. 添加环境变量：
   - `ADMIN_PASSWORD`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
4. 部署

## 使用说明

### 添加新作品

1. 登录管理后台
2. 点击"添加新作品"
3. 填写标题、分类、描述
4. 上传封面图片和其他图片
5. 点击"发布作品"

### 管理作品

在管理后台可以查看所有作品，并进行删除操作。

## 注意事项

- 部署时请务必修改默认密码
- 图片存储在 `public/works` 目录
- 数据存储在 `data/works.json` 文件

## License

MIT License
