import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "作品集 - Amazon 渲染 & 设计",
  description: "展示亚马逊产品渲染和设计的作品集网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={inter.className}>
        <main className="min-h-screen bg-[#0A0A0A]">
          {children}
        </main>
      </body>
    </html>
  );
}
