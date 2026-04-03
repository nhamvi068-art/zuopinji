'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              作品集
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
              首页
            </Link>
            <Link href="/#works" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
              作品
            </Link>
            {session ? (
              <>
                <Link href="/admin/upload" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium">
                  新建项目
                </Link>
                <Link href="/admin" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
                  管理后台
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  退出
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                登录
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block text-gray-700 dark:text-gray-200">
              首页
            </Link>
            <Link href="/#works" className="block text-gray-700 dark:text-gray-200">
              作品
            </Link>
            {session ? (
              <>
                <Link href="/admin/upload" className="block text-green-600 font-medium">
                  新建项目
                </Link>
                <Link href="/admin" className="block text-gray-700 dark:text-gray-200">
                  管理后台
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left text-red-500"
                >
                  退出
                </button>
              </>
            ) : (
              <Link href="/login" className="block text-blue-600">
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
