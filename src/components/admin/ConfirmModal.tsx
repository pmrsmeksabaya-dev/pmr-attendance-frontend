'use client';

import { useEffect, useId } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';

export type ConfirmModalVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  detailBadge?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const VARIANT_STYLES: Record<
  ConfirmModalVariant,
  {
    iconBg: string;
    badge: string;
    button: string;
    Icon: typeof AlertTriangle;
  }
> = {
  danger: {
    iconBg:
      'bg-red-100 dark:bg-red-950/90 text-[#D32F2F] border-red-200/80 dark:border-red-800/70',
    badge:
      'bg-red-50 dark:bg-red-950/70 border-red-200/70 dark:border-red-900/70 text-[#D32F2F] dark:text-red-200',
    button: 'bg-[#D32F2F] hover:bg-red-700 shadow-red-600/20',
    Icon: AlertTriangle,
  },
  warning: {
    iconBg:
      'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/70',
    badge:
      'bg-amber-50 dark:bg-amber-950/60 border-amber-200/70 dark:border-amber-900/70 text-amber-700 dark:text-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    Icon: ShieldAlert,
  },
  success: {
    iconBg:
      'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/70',
    badge:
      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/70 dark:border-emerald-900/70 text-emerald-700 dark:text-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    Icon: CheckCircle2,
  },
  info: {
    iconBg:
      'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/70',
    badge:
      'bg-sky-50 dark:bg-sky-950/60 border-sky-200/70 dark:border-sky-900/70 text-sky-700 dark:text-sky-200',
    button: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20',
    Icon: Info,
  },
};

export function ConfirmModal({
  open,
  title,
  description,
  detailBadge,
  confirmText = 'Ya, Hapus Permanen',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const style = VARIANT_STYLES[variant];
  const StatusIcon = style.Icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Indikator Bottom Sheet khusus Mobile */}
        <div className="sm:hidden flex justify-center pt-2.5">
          <span className="w-10 h-1 rounded-full bg-slate-200 dark:bg-red-900/70" />
        </div>

        {/* Top Accent & Close */}
        <div className="px-6 pt-5 sm:pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${style.iconBg}`}
            >
              <StatusIcon size={22} />
            </div>
            <div className="min-w-0">
              <h3
                id={titleId}
                className="text-base font-extrabold text-slate-900 dark:text-white leading-snug"
              >
                {title}
              </h3>
              {detailBadge && (
                <span
                  className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold break-all ${style.badge}`}
                >
                  {detailBadge}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-red-950/70 disabled:opacity-40 transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 pb-5">
          <p
            id={descId}
            className="text-xs leading-relaxed text-slate-600 dark:text-red-100/80"
          >
            {description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-red-950/40 border-t border-slate-100 dark:border-red-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-red-100 bg-white dark:bg-[#2A090C] border border-slate-200 dark:border-red-900/60 hover:bg-slate-100 dark:hover:bg-red-950 disabled:opacity-50 transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md disabled:opacity-50 transition ${style.button}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}