export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const ROLES = ['anggota', 'pengurus', 'admin', 'owner'] as const;
export type Role = (typeof ROLES)[number];

export const STATUS_KEHADIRAN = [
  'HADIR',
  'TERLAMBAT',
  'IZIN',
  'SAKIT',
  'ALPA',
] as const;
export type StatusKehadiran = (typeof STATUS_KEHADIRAN)[number];

export const STATUS_COLORS: Record<StatusKehadiran, string> = {
  HADIR: 'bg-green-100 text-green-700',
  TERLAMBAT: 'bg-yellow-100 text-yellow-700',
  IZIN: 'bg-blue-100 text-blue-700',
  SAKIT: 'bg-purple-100 text-purple-700',
  ALPA: 'bg-red-100 text-red-700',
};

export const STORAGE_KEYS = {
  JWT: 'pmr_jwt',
  USER: 'pmr_user',
} as const;