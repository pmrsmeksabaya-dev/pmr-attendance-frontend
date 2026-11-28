'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  KeyRound,
  ArrowRight,
  ClipboardPaste,
  ShieldCheck,
  UserCheck,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { saveSession, isLoggedIn, getUser } from '@/lib/auth';
import { OrgLogos } from '@/components/OrgLogos';

interface PortalLoginFormProps {
  portal: 'admin' | 'pengurus';
}

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/[?&]token=([a-zA-Z0-9._-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

function PortalLoginInner({ portal }: PortalLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicToken = searchParams.get('token');

  const isAdminPortal = portal === 'admin';
  const title = isAdminPortal ? 'PMR ADMIN' : 'PORTAL PENGURUS PMR';
  const subtitle = isAdminPortal
    ? 'Panel Manajemen & Pembina — SMKN 1 Pringgabaya'
    : 'Panel Operasional Pengurus — SMKN 1 Pringgabaya';
  const botCommand = isAdminPortal ? '!loginadmin' : '!loginpengurus';
  const targetRoute = isAdminPortal ? '/admin' : '/pengurus';
  const allowedRoles = isAdminPortal
    ? ['admin', 'owner']
    : ['pengurus', 'admin', 'owner'];

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(Boolean(magicToken));
  const processedRef = useRef(false);

  const verifyCode = async (rawInput: string) => {
    const cleanCode = extractToken(rawInput);
    if (!cleanCode) return;

    setLoading(true);
    try {
      const res = await api.verifyMagic(cleanCode, portal);
      const role = (res.user.role || '').toLowerCase();

      if (!allowedRoles.includes(role)) {
        toast.error(
          `Akses ditolak. Akun Anda berstatus "${res.user.role.toUpperCase()}", tidak memiliki izin untuk ${title}.`
        );
        if (role === 'pengurus') {
          router.replace('/pengurus');
        } else {
          router.replace('/absensi');
        }
        return;
      }

      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });

      toast.success(`Selamat datang, ${res.user.nama}!`);
      router.replace(targetRoute);
    } catch (err: any) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : err?.message || 'Token atau kode OTP tidak valid / kedaluwarsa.'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (magicToken) {
      if (processedRef.current) return;
      processedRef.current = true;
      setCode(extractToken(magicToken));
      verifyCode(magicToken);
      return;
    }

    if (isLoggedIn()) {
      const existingUser = getUser();
      const existingRole = (existingUser?.role || '').toLowerCase();
      if (allowedRoles.includes(existingRole)) {
        router.replace(targetRoute);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magicToken, router]);

  const handleInputChange = (value: string) => {
    const extracted = extractToken(value);
    setCode(extracted);

    if (value.includes('token=') && extracted.length >= 6) {
      verifyCode(extracted);
    }
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        toast.error('Clipboard kosong.');
        return;
      }
      const extracted = extractToken(clip);
      setCode(extracted);
      toast.success('Kode ditempel dari clipboard.');

      if (extracted.length >= 6) {
        verifyCode(extracted);
      }
    } catch {
      toast.error('Izin clipboard ditolak. Tempel manual menggunakan Ctrl+V / Tekan Lama.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6 || loading) return;
    await verifyCode(code);
  };

  if (magicToken && loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-[#230709] gap-3 p-4">
        <Loader2 className="animate-spin text-[#D32F2F]" size={36} />
        <p className="text-sm font-bold text-slate-700 dark:text-red-100">
          Memverifikasi Magic Link {title}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#230709] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#330C0F] rounded-3xl shadow-xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {/* Header dengan Tiga Logo Background Putih Permanen */}
        <div
          className={`p-6 text-white text-center bg-gradient-to-r ${
            isAdminPortal
              ? 'from-[#D32F2F] via-red-700 to-red-900'
              : 'from-rose-700 via-[#D32F2F] to-red-900'
          }`}
        >
          <div className="mb-3">
            <OrgLogos size="lg" shape="circle" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-xs text-white/85 mt-1">{subtitle}</p>
        </div>

        {/* Form OTP / Token WhatsApp */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/60 border border-red-200/70 dark:border-red-900/60 text-xs text-slate-700 dark:text-red-100/90 leading-relaxed">
            Kirim perintah{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#230709] border border-red-200/60 dark:border-red-800/60 font-mono font-extrabold text-[#D32F2F] dark:text-red-300">
              {botCommand}
            </code>{' '}
            melalui <b>Chat Pribadi (Japri)</b> ke Bot WhatsApp PMR, lalu klik{' '}
            <b>Magic Link</b> atau masukkan <b>Kode OTP / Token</b> di bawah.
          </div>

          <div>
            <label
              htmlFor="portal-token-input"
              className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-red-100"
            >
              Kode OTP (6 Digit) atau Token Magic Link
            </label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="portal-token-input"
                type="text"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="482910 / tempel link"
                className="w-full pl-10 pr-20 py-3 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-slate-900 dark:text-white font-mono text-sm sm:text-base font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900 transition"
              >
                <ClipboardPaste size={12} />
                <span>Paste</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length < 6}
            className="w-full py-3.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke {title}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Info Keamanan */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-red-200/60 pt-1">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Akses terbatas &amp; tercatat di Audit Log sistem.</span>
          </div>

          {/* Tautan Pindah Portal */}
          <div className="pt-3 border-t border-slate-100 dark:border-red-900/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-red-200/75">
            <Link
              href="/absensi/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <UserCheck size={13} />
              <span>Login Anggota</span>
            </Link>

            {isAdminPortal ? (
              <Link
                href="/pengurus/login"
                className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
              >
                <ClipboardList size={13} />
                <span>Portal Pengurus</span>
              </Link>
            ) : (
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
              >
                <ShieldAlert size={13} />
                <span>Portal Admin</span>
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#230709]">
          <Loader2 className="animate-spin text-[#D32F2F]" size={28} />
        </div>
      }
    >
      <PortalLoginInner portal={portal} />
    </Suspense>
  );
}