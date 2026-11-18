'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AbsensiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');
  const isDashboardRoot = pathname === '/absensi' || pathname === '/absensi/';
  const showBackButton = !isLoginPage && !isDashboardRoot;

  return (
    <div className={`min-h-screen flex flex-col ${isLoginPage ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-pmr-red text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {showBackButton && (
            <Link
              href="/absensi"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </Link>
          )}

          {/* Logo SMKN 1 Pringgabaya & PMR Wira */}
          <div className="flex items-center gap-2.5 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-9 h-9 bg-white rounded-full p-1 flex items-center justify-center shadow-sm">
                <img
                  src="/logo-smk.png"
                  alt="Logo SMKN 1 Pringgabaya"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-9 h-9 bg-white rounded-full p-1 flex items-center justify-center shadow-sm">
                <img
                  src="/logo-pmr.png"
                  alt="Logo PMR Wira"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="ml-0.5">
              <h1 className="font-bold text-sm leading-tight">PMR Attendance</h1>
              <p className="text-xs text-white/85 leading-tight">
                SMKN 1 Pringgabaya
              </p>
            </div>
          </div>

          <Link
            href="https://pmr-smeksabaya.vercel.app"
            className="text-xs text-white/85 hover:text-white hidden sm:block font-medium"
          >
            Website Utama →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-4 border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} PMR Wira Unit SMKN 1 Pringgabaya
      </footer>
    </div>
  );
}