import XLSX from 'xlsx-js-style';

export interface ExportMemberRow {
  nis?: string | null;
  nisn?: string | null;
  nama: string;
  kelas?: string | null;
  jurusan?: string | null;
  jenis_kelamin?: string | null;
  nomor_whatsapp?: string | null;
  angkatan?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  email?: string | null;
  golongan_darah?: string | null;
  tingkatan_pmr?: string | null;
  alergi?: string | null;
  nama_orang_tua?: string | null;
  no_orang_tua?: string | null;
  persetujuan_orang_tua?: boolean | null;
  jabatan?: string | null;
  status_anggota?: string | null;
}

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

const BORDER_HEADER = {
  top: { style: 'medium', color: { rgb: '7F1D1D' } },
  bottom: { style: 'medium', color: { rgb: '7F1D1D' } },
  left: { style: 'thin', color: { rgb: '991B1B' } },
  right: { style: 'thin', color: { rgb: '991B1B' } },
};

function formatTanggalLahir(val?: string | null): string {
  if (!val) return '-';
  const clean = String(val).slice(0, 10);
  const parsed = new Date(`${clean}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return clean;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function exportBukuIndukMembersExcel(
  members: ExportMemberRow[],
  options?: {
    unitName?: string;
    filterLabel?: string;
  }
) {
  const unitName = options?.unitName || 'PMR WIRA UNIT SMKN 1 PRINGGABAYA';
  const nowWita = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const totalAnggota = members.length;
  const totalAktif = members.filter(
    (m) => String(m.status_anggota || 'AKTIF').toUpperCase() === 'AKTIF'
  ).length;
  const totalL = members.filter(
    (m) => String(m.jenis_kelamin || '').toUpperCase() === 'L'
  ).length;
  const totalP = members.filter(
    (m) => String(m.jenis_kelamin || '').toUpperCase() === 'P'
  ).length;

  const headers = [
    'No',
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Kelas',
    'Jurusan',
    'JK',
    'Nomor WhatsApp',
    'Angkatan',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Gol. Darah',
    'Tingkatan PMR',
    'Jabatan',
    'Riwayat Alergi',
    'Nama Orang Tua',
    'No. HP Orang Tua',
    'Izin Ortu',
    'Status',
  ];

  const colCount = headers.length;
  const emptyRow = () => Array(colCount).fill('');

  // Susunan baris sheet
  const sheetMatrix: any[][] = [
    ['BUKU INDUK ANGGOTA PALANG MERAH REMAJA (PMR)', ...Array(colCount - 1).fill('')],
    [unitName.toUpperCase(), ...Array(colCount - 1).fill('')],
    [
      `Dicetak pada: ${nowWita} WITA  |  Total: ${totalAnggota} Anggota (Aktif: ${totalAktif} • L: ${totalL} • P: ${totalP})${
        options?.filterLabel ? `  |  Filter: ${options.filterLabel}` : ''
      }`,
      ...Array(colCount - 1).fill(''),
    ],
    emptyRow(), // Baris 4 pemisah
    headers,    // Baris 5 header tabel
  ];

  members.forEach((m, idx) => {
    const jk = String(m.jenis_kelamin || '-').toUpperCase();
    const status = String(m.status_anggota || 'AKTIF').toUpperCase();

    sheetMatrix.push([
      idx + 1,
      m.nis ? String(m.nis).trim() : '-',
      m.nisn ? String(m.nisn).trim() : '-',
      m.nama || '-',
      m.kelas || '-',
      m.jurusan || '-',
      jk,
      m.nomor_whatsapp ? String(m.nomor_whatsapp).trim() : '-',
      m.angkatan ? String(m.angkatan).trim() : '-',
      m.tempat_lahir || '-',
      formatTanggalLahir(m.tanggal_lahir),
      m.golongan_darah ? String(m.golongan_darah).toUpperCase() : '-',
      m.tingkatan_pmr || 'Wira',
      m.jabatan || 'Anggota',
      m.alergi || '-',
      m.nama_orang_tua || '-',
      m.no_orang_tua ? String(m.no_orang_tua).trim() : '-',
      m.persetujuan_orang_tua === true
        ? 'Ya'
        : m.persetujuan_orang_tua === false
          ? 'Belum'
          : '-',
      status,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetMatrix);

  // Merge judul kop dokumen (Baris 1 - 3)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
  ];

  // Style Kop Dokumen (Baris 1 - 3)
  for (let c = 0; c < colCount; c++) {
    const cellA1 = XLSX.utils.encode_cell({ r: 0, c });
    const cellA2 = XLSX.utils.encode_cell({ r: 1, c });
    const cellA3 = XLSX.utils.encode_cell({ r: 2, c });

    if (ws[cellA1]) {
      ws[cellA1].s = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '8E1C1C' } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      };
    }
    if (ws[cellA2]) {
      ws[cellA2].s = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FEE2E2' } },
        fill: { fgColor: { rgb: '991B1B' } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      };
    }
    if (ws[cellA3]) {
      ws[cellA3].s = {
        font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '7F1D1D' } },
        fill: { fgColor: { rgb: 'FEF2F2' } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: {
          bottom: { style: 'thin', color: { rgb: 'FECACA' } },
        },
      };
    }
  }

  // Style Header Tabel (Baris index 4 / Excel row 5)
  const HEADER_ROW_IDX = 4;
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: HEADER_ROW_IDX, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: 'B71C1C' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: BORDER_HEADER,
    };
  }

  // Kolom yang rata tengah & kolom teks (agar angka nol depan tidak hilang)
  const CENTER_COLS = new Set([0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 16, 17, 18]);
  const FORCE_TEXT_COLS = new Set([1, 2, 7, 16]);

  // Style Isi Data (Mulai baris index 5 / Excel row 6)
  for (let r = HEADER_ROW_IDX + 1; r < sheetMatrix.length; r++) {
    const isEvenRow = (r - HEADER_ROW_IDX) % 2 === 0;
    const baseFill = isEvenRow ? 'FFF8F8' : 'FFFFFF';

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      if (FORCE_TEXT_COLS.has(c)) {
        ws[addr].t = 's';
      }

      const rawVal = String(ws[addr].v ?? '').toUpperCase();
      let cellFill = baseFill;
      let fontColor = '1E293B';
      let isBold = c === 3; // Tebalkan Nama Lengkap

      // Badge warna kolom JK (index 6)
      if (c === 6) {
        isBold = true;
        if (rawVal === 'L') {
          cellFill = 'E0F2FE';
          fontColor = '0369A1';
        } else if (rawVal === 'P') {
          cellFill = 'FCE7F3';
          fontColor = 'BE185D';
        }
      }

      // Badge warna kolom Status (index 18)
      if (c === 18) {
        isBold = true;
        if (rawVal === 'AKTIF') {
          cellFill = 'DCFCE7';
          fontColor = '166534';
        } else {
          cellFill = 'FEE2E2';
          fontColor = '991B1B';
        }
      }

      ws[addr].s = {
        font: {
          name: 'Calibri',
          sz: 10,
          bold: isBold,
          color: { rgb: fontColor },
        },
        fill: { fgColor: { rgb: cellFill } },
        alignment: {
          horizontal: CENTER_COLS.has(c) ? 'center' : 'left',
          vertical: 'center',
          indent: CENTER_COLS.has(c) ? 0 : 1,
        },
        border: BORDER_THIN,
      };
    }
  }

  // Tinggi baris (Kop, Header, dan Data)
  ws['!rows'] = [
    { hpt: 26 }, // Baris 1 Judul
    { hpt: 20 }, // Baris 2 Subjudul
    { hpt: 19 }, // Baris 3 Info cetak
    { hpt: 10 }, // Baris 4 Spasi
    { hpt: 28 }, // Baris 5 Header tabel
    ...members.map(() => ({ hpt: 21 })),
  ];

  // Auto-fit lebar setiap kolom agar tidak ada teks terpotong
  ws['!cols'] = headers.map((headerText, colIdx) => {
    let maxLen = headerText.length;
    for (let r = HEADER_ROW_IDX + 1; r < sheetMatrix.length; r++) {
      const val = String(sheetMatrix[r][colIdx] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    }
    const minWidth = colIdx === 0 ? 5 : colIdx === 6 ? 6 : 11;
    return { wch: Math.max(minWidth, Math.min(maxLen + 5, 38)) };
  });

  // Aktifkan AutoFilter di baris header tabel (A5:S...)
  const lastColLetter = XLSX.utils.encode_col(colCount - 1);
  ws['!autofilter'] = {
    ref: `A5:${lastColLetter}${sheetMatrix.length}`,
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Buku Induk PMR');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Buku_Induk_Anggota_PMR_Wira_${today}.xlsx`);
}