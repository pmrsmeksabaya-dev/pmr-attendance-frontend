'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { OrgLogos } from '@/components/OrgLogos';

type PortalType = 'member' | 'pengurus' | 'admin';

const PORTAL_CONFIG: Record<
  PortalType,
  {
    label: string;
    redirectPath: string;
    loginPath: string;
    botCommand: string;
    allowedRoles: string[] | null;
  }
> = {
  member: {
    label: 'Portal Anggota',
    redirectPath: '/absensi',
    loginPath: '/absensi/login',
    botCommand: '!login atau !otp',
    allowedRoles: null,
  },
  pengurus: {
    label: 'Portal Pengurus',
    redirectPath: '/pengurus',
    loginPath: '/pengurus/login',
    botCommand: '!loginpengurus',
    allowedRoles: ['pengurus', 'admin', 'owner'],
  },
  admin: {
    label: 'Portal Admin',
    redirectPath: '/admin',
    loginPath: '/admin/login',
    botCommand: '!loginadmin',
    allowedRoles: ['admin', 'owner'],
  },
};

function resolvePortal(rawPortal: string | null): PortalType {
  const val = (rawPortal || '').toLowerCase().trim();
  if (val === 'pengurus' || val === 'admin') return val;
  return 'member';
}

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const portal = resolvePortal(params.get('portal'));
  const config = PORTAL_CONFIG[portal];

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [userName, setUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cegah pemanggilan ganda pada React Strict Mode
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      setStatus('error');
      setErrorMsg('Tautan verifikasi tidak lengkap atau token tidak ditemukan.');
      return;
    }

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    api
      .verifyMagic(cleanToken, portal)
      .then((res) => {
        const role = (res.user.role || '').toLowerCase();
        if (config.allowedRoles && !config.allowedRoles.includes(role)) {
          setStatus('error');
          setErrorMsg(
            `Akses ditolak. Akun Anda berstatus "${res.user.role.toUpperCase()}", tidak memiliki izin untuk masuk ke ${config.label}.`
          );
          return;
        }

        saveSession(res.jwt, {
          member_id: res.user.member_id,
          nama: res.user.nama,
          role: res.user.role as any,
        });
        setUserName(res.user.nama);
        setStatus('success');
        toast.success(`Selamat datang, ${res.user.nama}!`);
        setTimeout(() => {
          router.replace(config.redirectPath);
        }, 1000);
      })
      .catch((e: any) => {
        setStatus('error');
        setErrorMsg(
          e instanceof ApiError
            ? e.message
            : e?.message ||
                'Tautan sudah kedaluwarsa atau tidak valid. Silakan minta link baru via Bot WhatsApp.'
        );
      });
  }, [token, portal, config, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-6">
      <div className="w-full max-w-md bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60 p-6 sm:p-8 text-center">
        {/* Tiga Logo Organisasi dengan Background Putih Permanen */}
        <OrgLogos size="lg" className="mb-6" />

        {status === 'verifying' && (
          <div className="py-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold uppercase tracking-wider mb-4">
              <ShieldCheck size={12} />
              <span>{config.label}</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-[#D32F2F] animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Memverifikasi Tautan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-red-200/75 mt-1.5">
              Menghubungkan sesi akun PMR Wira Anda...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold mb-2">
              <ShieldCheck size={12} />
              <span>Terverifikasi • {config.label}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Login Berhasil
            </h2>
            <p className="text-sm text-slate-600 dark:text-red-100/85 mt-1">
              Selamat datang kembali,{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {userName}
              </span>
              !
            </p>
            <p className="text-xs text-slate-400 dark:text-red-200/60 mt-3">
              Mengalihkan ke dashboard...
            </p>

            <Link
              href={config.redirectPath}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <span>Lanjut ke Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-2">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Verifikasi Gagal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-red-100/85 mt-2 leading-relaxed">
              {errorMsg}
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-slate-50/90 dark:bg-red-950/45 border border-slate-200/70 dark:border-red-900/50 text-xs text-slate-600 dark:text-red-200/80 flex items-center justify-center gap-2">
              <MessageSquare size={14} className="text-[#D32F2F] shrink-0" />
              <span>
                Kirim{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-red-950 border border-slate-200 dark:border-red-800 font-mono font-bold text-[#D32F2F] dark:text-red-300">
                  {config.botCommand}
                </code>{' '}
                ke Bot WhatsApp PMR untuk meminta kode baru.
              </span>
            </div>

            <Link
              href={config.loginPath}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3.5 px-4 rounded-2xl text-sm font-bold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] transition-all"
            >
              <KeyRound size={15} />
              <span>Masuk ke {config.label}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[75vh]">
          <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}