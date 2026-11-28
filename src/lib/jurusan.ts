export interface JurusanOption {
  value: string;
  label: string;
  fullName: string;
}

export const JURUSAN_OPTIONS: JurusanOption[] = [
  {
    value: 'TKJ',
    label: 'TKJ — Teknik Komputer dan Jaringan',
    fullName: 'Teknik Komputer dan Jaringan',
  },
  {
    value: 'RPL',
    label: 'RPL — Rekayasa Perangkat Lunak',
    fullName: 'Rekayasa Perangkat Lunak',
  },
  {
    value: 'TKP',
    label: 'TKP — Teknik Konstruksi Perumahan',
    fullName: 'Teknik Konstruksi Perumahan',
  },
  {
    value: 'DPIB',
    label: 'DPIB — Desain Pemodelan dan Informasi Bangunan',
    fullName: 'Desain Pemodelan dan Informasi Bangunan',
  },
  {
    value: 'TPM',
    label: 'TPM — Teknik Pemesinan',
    fullName: 'Teknik Pemesinan',
  },
  {
    value: 'TKR',
    label: 'TKR — Teknik Kendaraan Ringan',
    fullName: 'Teknik Kendaraan Ringan',
  },
  {
    value: 'TPL',
    label: 'TPL — Teknik Pengelasan',
    fullName: 'Teknik Pengelasan',
  },
  {
    value: 'TSM',
    label: 'TSM — Teknik Sepeda Motor',
    fullName: 'Teknik Sepeda Motor',
  },
  {
    value: 'TPTU',
    label: 'TPTU — Teknik Pendingin dan Tata Udara',
    fullName: 'Teknik Pendingin dan Tata Udara',
  },
  {
    value: 'TITL',
    label: 'TITL — Teknik Instalasi Tenaga Listrik',
    fullName: 'Teknik Instalasi Tenaga Listrik',
  },
  {
    value: 'TAV',
    label: 'TAV — Teknik Audio Video',
    fullName: 'Teknik Audio Video',
  },
  {
    value: 'TJAT',
    label: 'TJAT — Teknik Jaringan Akses dan Telekomunikasi',
    fullName: 'Teknik Jaringan Akses dan Telekomunikasi',
  },
  {
    value: 'TELIN',
    label: 'TELIN — Teknik Elektronika Industri',
    fullName: 'Teknik Elektronika Industri',
  },
  {
    value: 'TESHA',
    label: 'TESHA — Teknik Energi Surya Hidro dan Angin',
    fullName: 'Teknik Energi Surya Hidro dan Angin',
  },
];

// Urutkan kode terpanjang lebih dulu agar pencocokan singkatan presisi
const SORTED_JURUSAN = [...JURUSAN_OPTIONS].sort(
  (a, b) => b.value.length - a.value.length
);

/**
 * Mengekstrak kode jurusan (misal: 'RPL', 'TKJ', 'TELIN') dari teks kelas atau jurusan.
 * Contoh:
 * - "XII-RPL 2"  -> "RPL"
 * - "XIII RPL 2" -> "RPL"
 * - "Rekayasa Perangkat Lunak" -> "RPL"
 */
export function extractJurusanFromKelas(value?: string | null): string {
  if (!value) return '';
  const upper = value.trim().toUpperCase();

  for (const item of SORTED_JURUSAN) {
    const codePattern = new RegExp(`(^|[^A-Z0-9])${item.value}([^A-Z0-9]|$)`);
    if (codePattern.test(upper) || upper === item.fullName.toUpperCase()) {
      return item.value;
    }
  }

  const cleaned = value
    .trim()
    .replace(/^(X[Il]{1,3}|13|12|11|10)[\s-]+/i, '')
    .replace(/[\s-]+\d+$/, '')
    .trim();

  return cleaned ? cleaned.toUpperCase() : '';
}

/**
 * Mengubah kode/teks jurusan atau kelas menjadi kepanjangan resminya.
 * Contoh: ("XIII RPL 2", "XIII RPL") -> "Rekayasa Perangkat Lunak"
 */
export function resolveJurusanFullName(
  kelas?: string | null,
  jurusan?: string | null
): string {
  const code =
    extractJurusanFromKelas(jurusan) || extractJurusanFromKelas(kelas);

  if (code) {
    const found = JURUSAN_OPTIONS.find((item) => item.value === code);
    if (found) return found.fullName;
  }

  const cleanJurusan = (jurusan || '').trim();
  const cleanKelas = (kelas || '').trim();

  if (
    !cleanJurusan ||
    cleanJurusan === '-' ||
    cleanJurusan.toUpperCase() === cleanKelas.toUpperCase() ||
    cleanKelas.toUpperCase().startsWith(cleanJurusan.toUpperCase())
  ) {
    return '';
  }

  return cleanJurusan;
}

/**
 * Menggabungkan kelas & kepanjangan jurusan tanpa duplikasi.
 * Contoh: ("XIII RPL 2", "XIII RPL") -> "XIII RPL 2 • Rekayasa Perangkat Lunak"
 */
export function formatKelasJurusan(
  kelas?: string | null,
  jurusan?: string | null
): string {
  const cleanKelas = (kelas || '').trim();
  const fullJurusan = resolveJurusanFullName(cleanKelas, jurusan);

  if (cleanKelas && fullJurusan) {
    return `${cleanKelas} • ${fullJurusan}`;
  }
  return cleanKelas || fullJurusan || '';
}