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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#D32F2F' },
    { media: '(prefers-color-scheme: dark)', color: '#230709' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pmr-attendance.vercel.app'),
  title: {
    default: 'PMR Attendance — SMKN 1 Pringgabaya',
    template: '%s | PMR Attendance',
  },
  description:
    'Sistem Absensi Digital Terintegrasi Bot WhatsApp — Palang Merah Remaja (PMR Wira) Unit SMKN 1 Pringgabaya.',
  applicationName: 'PMR Attendance',
  keywords: [
    'PMR Wira',
    'SMKN 1 Pringgabaya',
    'Absensi Digital',
    'Palang Merah Remaja',
    'PMR Smeksabaya',
  ],
  icons: {
    icon: '/logo-pmr.png',
    shortcut: '/logo-pmr.png',
    apple: '/logo-pmr.png',
  },
  openGraph: {
    title: 'PMR Attendance — SMKN 1 Pringgabaya',
    description:
      'Sistem Absensi Digital Terintegrasi Bot WhatsApp — Palang Merah Remaja (PMR Wira) Unit SMKN 1 Pringgabaya.',
    url: 'https://pmr-attendance.vercel.app',
    siteName: 'PMR Attendance SMKN 1 Pringgabaya',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/logo-pmr.png',
        width: 512,
        height: 512,
        alt: 'Logo PMR Wira SMKN 1 Pringgabaya',
      },
    ],
  },
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme') || localStorage.getItem('pmr-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${jakarta.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-slate-50 dark:bg-[#230709] font-sans text-slate-900 dark:text-red-50 antialiased selection:bg-red-100 selection:text-[#D32F2F] dark:selection:bg-red-900/70 dark:selection:text-white print:bg-white print:text-slate-900">
        {children}
        <div className="print:hidden">
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className:
                '!rounded-2xl !border !border-slate-200/80 dark:!border-red-900/60 dark:!bg-[#330C0F] dark:!text-red-50 !shadow-lg !font-sans !text-sm',
            }}
          />
        </div>
      </body>
    </html>
  );
}