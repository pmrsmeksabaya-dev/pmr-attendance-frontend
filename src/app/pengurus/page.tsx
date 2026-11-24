'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  HeartPulse,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface DashboardSummary {
  totalAnggota: number;
  anggotaAktif: number;
  izinOrtuLengkap: number;
  saldoKas: number;
  totalMasuk: number;
  totalKeluar: number;
  totalLogUks: number;
  pasienBulanIni: number;
  totalJenisAlat: number;
  totalUnitBaik: number;
  totalUnitRusak: number;
  recentKas: any[];
  recentUks: any[];
}

export default function PengurusHomePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardSummary>({
    totalAnggota: 0,
    anggotaAktif: 0,
    izinOrtuLengkap: 0,
    saldoKas: 0,
    totalMasuk: 0,
    totalKeluar: 0,
    totalLogUks: 0,
    pasienBulanIni: 0,
    totalJenisAlat: 0,
    totalUnitBaik: 0,
    totalUnitRusak: 0,
    recentKas: [],
    recentUks: [],
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const [membersRes, kasRes, uksRes, invRes] = await Promise.all([
        apiFetch<{ data: any[] }>('/api/pengurus/members'),
        apiFetch<{ data: any[]; summary: any }>('/api/pengurus/kas'),
        apiFetch<{ data: any[] }>('/api/pengurus/uks'),
        apiFetch<{ data: any[] }>('/api/pengurus/inventaris'),
      ]);

      const members = membersRes.data || [];
      const kasRows = kasRes.data || [];
      const kasSummary = kasRes.summary || {
        totalMasuk: 0,
        totalKeluar: 0,
        saldo: 0,
      };
      const uksLogs = uksRes.data || [];
      const invItems = invRes.data || [];

      const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM

      setStats({
        totalAnggota: members.length,
        anggotaAktif: members.filter((m) => m.status_anggota === 'AKTIF').length,
        izinOrtuLengkap: members.filter((m) => m.persetujuan_orang_tua).length,
        saldoKas: Number(kasSummary.saldo || 0),
        totalMasuk: Number(kasSummary.totalMasuk || 0),
        totalKeluar: Number(kasSummary.totalKeluar || 0),
        totalLogUks: uksLogs.length,
        pasienBulanIni: uksLogs.filter((l) =>
          String(l.tanggal || '').startsWith(currentMonthPrefix)
        ).length,
        totalJenisAlat: invItems.length,
        totalUnitBaik: invItems.reduce(
          (acc, item) => acc + Number(item.jumlah_baik || 0),
          0
        ),
        totalUnitRusak: invItems.reduce(
          (acc, item) => acc + Number(item.jumlah_rusak || 0),
          0
        ),
        recentKas: kasRows.slice(0, 4),
        recentUks: uksLogs.slice(0, 4),
      });
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat statistik pengurus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  const MODULES = [
    {
      title: 'Sekretaris & Divisi Keanggotaan',
      desc: 'Kelola buku induk 16 kolom biodata anggota, golongan darah, alergi, dan izin orang tua.',
      href: '/pengurus/anggota',
      icon: Users,
    },
    {
      title: 'Bendahara PMR',
      desc: 'Catat pemasukan kas rutin, pengeluaran operasional, dan pantau saldo kas aktif.',
      href: '/pengurus/keuangan',
      icon: Wallet,
    },
    {
      title: 'Divisi UKS & P3K',
      desc: 'Log kunjungan pasien siswa, keluhan, tindakan pertolongan, dan penggunaan obat P3K.',
      href: '/pengurus/uks',
      icon: HeartPulse,
    },
    {
      title: 'Divisi Perlengkapan',
      desc: 'Inventaris tandu, tas P3K, tensimeter, kondisi baik/rusak, dan lokasi penyimpanan.',
      href: '/pengurus/inventaris',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Dashboard Pengurus PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1">
            Ringkasan statistik &amp; koordinasi Ketua, Wakil, Sekretaris,
            Bendahara, dan Ketua Divisi SMKN 1 Pringgabaya.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/70 hover:border-[#D32F2F] transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* 4 Kartu Statistik Utama */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 flex items-center justify-center"
            >
              <Loader2 className="animate-spin text-[#D32F2F]" size={22} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Anggota */}
          <Link
            href="/pengurus/anggota"
            className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-red-200/75">
                Anggota Aktif
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-extrabold">
              {stats.anggotaAktif}{' '}
              <span className="text-xs font-semibold text-slate-400">
                / {stats.totalAnggota} total
              </span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{stats.izinOrtuLengkap} memiliki izin orang tua</span>
            </p>
          </Link>

          {/* Card 2: Saldo Kas */}
          <Link
            href="/pengurus/keuangan"
            className="bg-gradient-to-br from-[#D32F2F] to-red-800 text-white p-5 rounded-2xl shadow-md hover:opacity-95 transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/85">
                Saldo Kas Bendahara
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <p className="text-2xl font-extrabold truncate">
              {formatRp(stats.saldoKas)}
            </p>
            <p className="text-[11px] text-white/80 font-medium truncate">
              Masuk {formatRp(stats.totalMasuk)} • Keluar{' '}
              {formatRp(stats.totalKeluar)}
            </p>
          </Link>

          {/* Card 3: Pelayanan UKS */}
          <Link
            href="/pengurus/uks"
            className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-red-200/75">
                Pelayanan UKS
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center">
                <HeartPulse size={16} />
              </div>
            </div>
            <p className="text-2xl font-extrabold">
              {stats.pasienBulanIni}{' '}
              <span className="text-xs font-semibold text-slate-400">
                pasien bulan ini
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-red-200/70 font-medium">
              Total riwayat tercatat: {stats.totalLogUks} penanganan
            </p>
          </Link>

          {/* Card 4: Inventaris Alat */}
          <Link
            href="/pengurus/inventaris"
            className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-red-200/75">
                Logistik &amp; Alat PMR
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center">
                <Package size={16} />
              </div>
            </div>
            <p className="text-2xl font-extrabold">
              {stats.totalUnitBaik}{' '}
              <span className="text-xs font-semibold text-emerald-600">
                unit siap pakai
              </span>
            </p>
            <p className="text-[11px] font-medium flex items-center gap-1 text-slate-500 dark:text-red-200/70">
              {stats.totalUnitRusak > 0 ? (
                <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle size={12} /> {stats.totalUnitRusak} unit rusak
                  ({stats.totalJenisAlat} jenis)
                </span>
              ) : (
                <span>
                  {stats.totalJenisAlat} jenis barang • Seluruh unit kondisi baik
                </span>
              )}
            </p>
          </Link>
        </div>
      )}

      {/* Ringkasan Aktivitas Terbaru (Kas & UKS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaksi Kas Terbaru */}
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Transaksi Kas Terbaru</h2>
            <Link
              href="/pengurus/keuangan"
              className="text-[11px] font-bold text-[#D32F2F] hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>
          {stats.recentKas.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Belum ada transaksi kas tercatat.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-red-900/40 text-xs">
              {stats.recentKas.map((k) => (
                <div
                  key={k.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{k.keterangan}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(k.tanggal).toLocaleDateString('id-ID')} •{' '}
                      {k.kategori}
                    </p>
                  </div>
                  <span
                    className={`font-extrabold whitespace-nowrap ${
                      k.jenis === 'MASUK'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {k.jenis === 'MASUK' ? '+' : '-'} {formatRp(k.nominal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pelayanan UKS Terbaru */}
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Penanganan UKS Terbaru</h2>
            <Link
              href="/pengurus/uks"
              className="text-[11px] font-bold text-[#D32F2F] hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>
          {stats.recentUks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Belum ada catatan pelayanan UKS.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-red-900/40 text-xs">
              {stats.recentUks.map((u) => (
                <div
                  key={u.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {u.nama_pasien}{' '}
                      <span className="font-normal text-slate-400">
                        ({u.kelas_pasien})
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-red-200/70 truncate">
                      Keluhan: {u.keluhan} • Tindakan: {u.tindakan}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(u.tanggal).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Akses Cepat Bidang & Divisi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition flex items-start justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h2 className="font-extrabold text-sm group-hover:text-[#D32F2F] transition">
                  {m.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-red-200/75 leading-relaxed">
                  {m.desc}
                </p>
              </div>
              <ArrowUpRight
                size={18}
                className="text-slate-400 group-hover:text-[#D32F2F] shrink-0"
              />
            </Link>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/50 border border-red-200/70 dark:border-red-900/60 flex items-center gap-3 text-xs text-slate-700 dark:text-red-100">
        <ShieldCheck size={18} className="text-[#D32F2F] shrink-0" />
        <span>
          Divisi Humas &amp; Divisi Media berkoordinasi melalui dokumentasi
          kegiatan dan pengumuman resmi WhatsApp tanpa perlu input data terpisah
          di portal ini.
        </span>
      </div>
    </div>
  );
}