/**
 * scripts/process-images.mjs
 *
 * 静态资源预处理脚本：在开发阶段一键处理 public/works/ 目录下的原图。
 *
 * 功能：
 *   1. 遍历 public/works/ 目录下的所有 JPG/PNG 原图（排除 thumbs/ 目录）
 *   2. 使用 sharp 提取每张原图的真实 width 和 height
 *   3. 生成 WebP 格式缩略图（宽度 600px，质量 80%），保存到 public/works/thumbs/
 *   4. 生成极小尺寸的 Base64 BlurHash（20px 宽度的模糊 webp 的 base64 字符串）
 *   5. 将提取到的信息更新写回到 data/works.json 中
 *
 * 运行方式：
 *   node scripts/process-images.mjs
 *
 * 依赖安装：
 *   npm install sharp
 */

import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, '..');
const WORKS_DIR = path.join(ROOT_DIR, 'public', 'works');
const THUMBS_DIR = path.join(ROOT_DIR, 'public', 'works', 'thumbs');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'works.json');

// 缩略图配置
const THUMB_WIDTH = 600;
const THUMB_QUALITY = 80;
const BLUR_WIDTH = 20;

// 支持的图片扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * 检查目录是否存在
 */
async function dirExists(dir) {
  try {
    await access(dir, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 递归遍历目录获取所有图片文件路径
 */
async function getImageFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 thumbs 目录
      if (entry.name !== 'thumbs') {
        await getImageFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * 将相对路径转换为 public 路径
 */
function toPublicPath(absPath) {
  return absPath.replace(path.join(ROOT_DIR, 'public'), '');
}

/**
 * 生成缩略图路径
 */
function getThumbPath(publicPath) {
  const ext = path.extname(publicPath);
  const base = publicPath.slice(0, -ext.length);
  return `${base}.thumb.webp`;
}

/**
 * 提取图片的真实宽高
 */
async function getImageDimensions(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * 生成 Base64 BlurHash
 * 将图片缩小到 BLUR_WIDTH 宽度，然后转为 webp 并转为 base64
 */
async function generateBlurDataURL(imagePath) {
  const buffer = await sharp(imagePath)
    .resize(BLUR_WIDTH)
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * 生成缩略图
 */
async function generateThumbnail(imagePath, thumbPath) {
  await sharp(imagePath)
    .resize(THUMB_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: THUMB_QUALITY })
    .toFile(thumbPath);
}

/**
 * 更新 works.json 中的图片信息
 */
async function updateWorksJson(imageUpdates) {
  let worksData = [];

  try {
    const content = await readFile(DATA_FILE, 'utf-8');
    worksData = JSON.parse(content);
  } catch (error) {
    console.error(`  无法读取 ${DATA_FILE}，跳过更新`);
    return;
  }

  let updatedCount = 0;

  for (const update of imageUpdates) {
    const { src, width, height, thumb, blurDataURL } = update;

    for (const work of worksData) {
      // 检查封面图
      if (work.coverImage === src) {
        work.coverImageWidth = width;
        work.coverImageHeight = height;
        work.coverImageThumb = thumb;
        work.coverImageBlurDataURL = blurDataURL;
        updatedCount++;
      }

      // 检查 images 数组中的图片
      for (const img of work.images) {
        if (img.src === src) {
          img.width = width;
          img.height = height;
          img.thumb = thumb;
          img.blurDataURL = blurDataURL;
          updatedCount++;
        }
      }
    }
  }

  await writeFile(DATA_FILE, JSON.stringify(worksData, null, 2), 'utf-8');
  console.log(`\n  已更新 works.json 中的 ${updatedCount} 条图片记录`);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n========================================');
  console.log('  图片预处理脚本');
  console.log('========================================\n');

  console.log('  配置信息：');
  console.log(`    原图目录: ${WORKS_DIR}`);
  console.log(`    缩略图目录: ${THUMBS_DIR}`);
  console.log(`    数据文件: ${DATA_FILE}`);
  console.log(`    缩略图宽度: ${THUMB_WIDTH}px`);
  console.log(`    缩略图质量: ${THUMB_QUALITY}%`);
  console.log(`    BlurHash 宽度: ${BLUR_WIDTH}px`);
  console.log('');

  // 检查目录
  if (!(await dirExists(WORKS_DIR))) {
    console.error(`  错误: 原图目录不存在: ${WORKS_DIR}`);
    process.exit(1);
  }

  // 创建 thumbs 目录
  if (!(await dirExists(THUMBS_DIR))) {
    console.log(`  创建缩略图目录: ${THUMBS_DIR}`);
    await mkdir(THUMBS_DIR, { recursive: true });
  }

  // 获取所有图片文件
  console.log('  扫描图片文件...');
  const imageFiles = await getImageFiles(WORKS_DIR);
  console.log(`  找到 ${imageFiles.length} 张图片\n`);

  if (imageFiles.length === 0) {
    console.log('  没有找到需要处理的图片，退出。\n');
    return;
  }

  const imageUpdates = [];
  let processed = 0;
  let failed = 0;

  // 处理每张图片
  for (const imagePath of imageFiles) {
    processed++;
    const relativePath = toPublicPath(imagePath);
    const thumbPublicPath = getThumbPath(relativePath);
    const thumbAbsPath = path.join(ROOT_DIR, 'public', thumbPublicPath);

    const progress = `[${processed}/${imageFiles.length}]`;
    console.log(`  ${progress} 处理: ${relativePath}`);

    try {
      // 1. 提取真实宽高
      const dimensions = await getImageDimensions(imagePath);
      console.log(`           原始尺寸: ${dimensions.width} x ${dimensions.height}`);

      // 2. 生成缩略图
      await generateThumbnail(imagePath, thumbAbsPath);
      console.log(`           缩略图: ${thumbPublicPath}`);

      // 3. 生成 BlurHash
      const blurDataURL = await generateBlurDataURL(imagePath);
      console.log(`           BlurHash: 已生成 (${blurDataURL.length} 字符)`);

      imageUpdates.push({
        src: relativePath,
        width: dimensions.width,
        height: dimensions.height,
        thumb: thumbPublicPath,
        blurDataURL,
      });

      console.log(`           ✓ 完成\n`);
    } catch (error) {
      failed++;
      console.error(`           ✗ 失败: ${error.message}\n`);
    }
  }

  // 更新 works.json
  if (imageUpdates.length > 0) {
    console.log('  更新 data/works.json...');
    await updateWorksJson(imageUpdates);
  }

  // 总结
  console.log('\n========================================');
  console.log('  处理完成');
  console.log('========================================');
  console.log(`  总计: ${imageFiles.length} 张图片`);
  console.log(`  成功: ${imageFiles.length - failed} 张`);
  console.log(`  失败: ${failed} 张`);
  console.log('');
}

main().catch(console.error);
