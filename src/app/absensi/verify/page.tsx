'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [userName, setUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cegah pemanggilan ganda pada React Strict Mode
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!token || !token.trim()) {
      setStatus('error');
      setErrorMsg('Tautan verifikasi tidak lengkap atau token tidak ditemukan.');
      return;
    }

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    api
      .verifyMagic(token.trim())
      .then((res) => {
        saveSession(res.jwt, {
          member_id: res.user.member_id,
          nama: res.user.nama,
          role: res.user.role as any,
        });
        setUserName(res.user.nama);
        setStatus('success');
        toast.success(`Selamat datang, ${res.user.nama}!`);
        setTimeout(() => {
          router.replace('/absensi');
        }, 1200);
      })
      .catch((e: any) => {
        setStatus('error');
        setErrorMsg(
          e instanceof ApiError
            ? e.message
            : 'Tautan sudah kedaluwarsa atau tidak valid. Silakan minta link baru via Bot WhatsApp.'
        );
      });
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 text-center">
        {/* Emblem Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img
            src="/logo-smk.png"
            alt="Logo SMKN 1 Pringgabaya"
            className="w-12 h-12 object-contain"
          />
          <div className="h-8 w-px bg-slate-200" />
          <img
            src="/logo-pmr.png"
            alt="Logo PMR Wira"
            className="w-12 h-12 object-contain"
          />
        </div>

        {status === 'verifying' && (
          <div className="py-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-pmr-red animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Memverifikasi Tautan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Menghubungkan sesi akun PMR Wira Anda...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-2">
              <ShieldCheck size={12} />
              Terverifikasi
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Login Berhasil
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Selamat datang kembali,{' '}
              <span className="font-bold text-slate-900">{userName}</span>!
            </p>
            <p className="text-xs text-slate-400 mt-4">
              Mengalihkan ke dashboard absensi...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-2">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200/70 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verifikasi Gagal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {errorMsg}
            </p>

            <Link
              href="/absensi/login"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] transition-all"
            >
              <span>Masuk dengan Kode OTP</span>
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
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="animate-spin text-pmr-red" size={32} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}