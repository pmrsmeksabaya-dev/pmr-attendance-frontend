import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#dc2626',
};

export const metadata: Metadata = {
  title: {
    default: 'PMR Attendance — SMKN 1 Pringgabaya',
    template: '%s | PMR Attendance',
  },
  description:
    'Sistem Absensi Digital Terintegrasi Bot WhatsApp — Palang Merah Remaja (PMR Wira) Unit SMKN 1 Pringgabaya.',
  icons: {
    icon: '/logo-pmr.png',
    apple: '/logo-pmr.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-red-100 selection:text-pmr-red">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className:
              '!rounded-2xl !border !border-slate-100 !shadow-lg !font-sans !text-sm',
          }}
        />
      </body>
    </html>
  );
}