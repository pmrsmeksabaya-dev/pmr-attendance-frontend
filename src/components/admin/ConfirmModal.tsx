'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  detailBadge?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  detailBadge,
  confirmText = 'Ya, Hapus Permanen',
  cancelText = 'Batal',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Accent & Close */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/90 text-[#D32F2F] flex items-center justify-center shrink-0 border border-red-200/80 dark:border-red-800/70">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              {detailBadge && (
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/70 border border-red-200/70 dark:border-red-900/70 text-[11px] font-bold text-[#D32F2F] dark:text-red-200">
                  {detailBadge}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-red-950/70 disabled:opacity-40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 pb-5">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-red-100/80">
            {description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-red-950/40 border-t border-slate-100 dark:border-red-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-red-100 bg-white dark:bg-[#2A090C] border border-slate-200 dark:border-red-900/60 hover:bg-slate-100 dark:hover:bg-red-950 disabled:opacity-50 transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#D32F2F] hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}