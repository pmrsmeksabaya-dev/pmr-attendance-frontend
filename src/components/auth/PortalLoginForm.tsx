'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, ShieldCheck, ClipboardCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PortalLoginFormProps {
  portal: 'admin' | 'pengurus';
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
  const allowedRoles = isAdminPortal ? ['admin', 'owner'] : ['pengurus'];

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(Boolean(magicToken));

  const saveAndRedirect = (jwt: string, user: { member_id: number; nama: string; role: string }) => {
    const role = (user.role || '').toLowerCase();
    if (!allowedRoles.includes(role)) {
      throw new Error(
        `Akses ditolak. Akun Anda berstatus "${user.role.toUpperCase()}", bukan untuk ${title}.`
      );
    }

    localStorage.setItem('pmr_jwt', jwt);
    localStorage.setItem('pmr_user', JSON.stringify(user));
    toast.success(`Selamat datang, ${user.nama}!`);
    router.replace(targetRoute);
  };

  const verifyCode = async (code: string) => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const res = await fetch(`${apiBase}/api/auth/verify-magic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code.trim(), portal }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Token atau kode OTP tidak valid / kedaluwarsa.');
    }

    saveAndRedirect(data.jwt, data.user);
  };

  // Auto-verifikasi saat user membuka Magic Link (?token=...)
  useEffect(() => {
    if (!magicToken) return;

    let cancelled = false;
    (async () => {
      try {
        await verifyCode(magicToken);
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err.message || 'Magic link tidak valid atau sudah digunakan.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [magicToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    try {
      await verifyCode(otp);
    } catch (err: any) {
      toast.error(err.message || 'Kode OTP salah atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (magicToken && loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1F0709] gap-3 p-4">
        <Loader2 className="animate-spin text-[#D32F2F]" size={36} />
        <p className="text-sm font-bold text-slate-700 dark:text-red-100">
          Memverifikasi Magic Link {title}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#1F0709] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#2A090C] rounded-3xl shadow-xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 text-white text-center bg-gradient-to-r ${
            isAdminPortal
              ? 'from-[#D32F2F] to-red-800'
              : 'from-rose-700 to-red-900'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/15 mx-auto flex items-center justify-center mb-3">
            {isAdminPortal ? <ShieldCheck size={26} /> : <ClipboardCheck size={26} />}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
        </div>

        {/* Form OTP WhatsApp */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/60 border border-red-200/70 dark:border-red-900/60 text-xs text-slate-700 dark:text-red-100/90 leading-relaxed">
            Kirim perintah{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#330C0F] font-mono font-extrabold text-[#D32F2F]">
              {botCommand}
            </code>{' '}
            melalui <b>Chat Pribadi (Japri)</b> ke Bot WhatsApp PMR, lalu klik <b>Magic Link</b> atau masukkan <b>6 digit kode OTP</b> di bawah.
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-red-100">
              Kode OTP WhatsApp (6 Digit)
            </label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-center font-mono text-xl font-extrabold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Masuk ke {title}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#1F0709]">
          <Loader2 className="animate-spin text-[#D32F2F]" size={28} />
        </div>
      }
    >
      <PortalLoginInner portal={portal} />
    </Suspense>
  );
}