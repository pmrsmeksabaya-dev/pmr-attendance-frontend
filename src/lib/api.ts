'use client';

import { API_BASE_URL } from './constants';
import { getJwt, clearSession } from './auth';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;   // default: true (kirim JWT)
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers = {}, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const jwt = getJwt();
    if (jwt) finalHeaders['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  // Kalau 401 → session expired
  if (res.status === 401) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/absensi/login';
    }
    throw new ApiError('Sesi login kedaluwarsa. Silakan login ulang.', 401);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || 'Request gagal.', res.status);
  }

  return data as T;
}

// ============================================================
// ENDPOINT SPECIFIC
// ============================================================

export interface ValidateTokenResult {
  session_id: number;
  activity_id: number | null;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_mulai: string;
  lokasi: string | null;
}

export interface AttendanceResult {
  id: number;
  session_id: number;
  member_id: number;
  nama: string;
  kelas: string;
  jenis_kelamin: string;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_absen: string;
  status_kehadiran: string;
}

export interface HistoryItem {
  id: number;
  waktu_absen: string;
  status_kehadiran: string;
  attendance_sessions: {
    nama_kegiatan: string;
    tanggal_kegiatan: string;
    lokasi: string | null;
  };
}

export interface HistoryResponse {
  data: HistoryItem[];
  summary: {
    HADIR: number;
    TERLAMBAT: number;
    IZIN: number;
    SAKIT: number;
    ALPA: number;
    TOTAL: number;
  };
}

export interface ProfileResponse {
  id: number;
  nama: string;
  kelas: string;
  jurusan: string;
  jenis_kelamin: string;
  nomor_whatsapp: string;
  jabatan: string | null;
  angkatan: string;
  status_anggota: string;
}

export const api = {
  // Auth
  verifyMagic: (token: string) =>
    apiFetch<{
      jwt: string;
      user: { member_id: number; nama: string; role: string };
    }>('/api/auth/verify-magic', {
      method: 'POST',
      body: JSON.stringify({ token }),
      auth: false,
    }),

  // Public (butuh JWT)
  validateToken: (token: string) =>
    apiFetch<ValidateTokenResult>('/api/public/validate-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  attend: (token: string) =>
    apiFetch<AttendanceResult>('/api/public/attend', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getHistory: () => apiFetch<HistoryResponse>('/api/public/me/history'),

  getProfile: () => apiFetch<ProfileResponse>('/api/public/me/profile'),
};