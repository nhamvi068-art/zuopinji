import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/** 从图片 buffer 解析宽高（不依赖外部库） */
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG: magic 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    const w = buffer.readUInt32BE(16);
    const h = buffer.readUInt32BE(20);
    return { width: w, height: h };
  }
  // JPEG: magic FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      // SOF0/SOF1/SOF2 = 0xC0/0xC1/0xC2
      if (marker >= 0xc0 && marker <= 0xc3) {
        const h = buffer.readUInt16BE(offset + 5);
        const w = buffer.readUInt16BE(offset + 7);
        return { width: w, height: h };
      }
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  // GIF: magic 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    const w = buffer.readUInt16LE(6);
    const h = buffer.readUInt16LE(8);
    return { width: w, height: h };
  }
  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[4] === 0x57 && buffer[5] === 0x45 && buffer[6] === 0x42 && buffer[7] === 0x50) {
    const sig = buffer.slice(8, 12).toString();
    if (sig === 'VP8 ') {
      // lossy or lossless
      const w = buffer.readUInt16LE(26) & 0x3fff;
      const h = buffer.readUInt16LE(28) & 0x3fff;
      return { width: w, height: h };
    }
  }
  // 默认
  return { width: 800, height: 600 };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { width, height } = getImageDimensions(buffer);

    const uploadDir = path.join(process.cwd(), 'public', 'works');
    await mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/works/${filename}`;
    return NextResponse.json({ url, width, height });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
