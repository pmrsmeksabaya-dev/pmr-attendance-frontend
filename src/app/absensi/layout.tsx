'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';

export default function AbsensiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-pmr-red text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {!isLoginPage && (
            <Link
              href="/absensi"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </Link>
          )}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
              <Heart className="text-pmr-red" size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">PMR Attendance</h1>
              <p className="text-xs text-white/80 leading-tight">
                SMKN 1 Pringgabaya
              </p>
            </div>
          </div>
          <Link
            href="https://pmr-smeksabaya.vercel.app"
            className="text-xs text-white/80 hover:text-white hidden sm:block"
          >
            Website Utama →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">{children}</main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()} PMR Wira Unit SMKN 1 Pringgabaya
      </footer>
    </div>
  );
}