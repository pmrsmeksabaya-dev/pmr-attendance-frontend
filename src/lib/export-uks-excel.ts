import XLSX from 'xlsx-js-style';

export interface ExportUksRow {
  id?: number;
  tanggal?: string | null;
  waktu?: string | null;
  nama_pasien: string;
  kelas_pasien?: string | null;
  keluhan?: string | null;
  tindakan?: string | null;
  obat_diberikan?: string | null;
  obat_digunakan?: string | null;
  petugas?: {
    nama?: string | null;
    jabatan?: string | null;
  } | null;
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

const BORDER_TOTAL = {
  top: { style: 'medium', color: { rgb: '991B1B' } },
  bottom: { style: 'double', color: { rgb: '7F1D1D' } },
  left: { style: 'thin', color: { rgb: 'FCA5A5' } },
  right: { style: 'thin', color: { rgb: 'FCA5A5' } },
};

function formatTanggalUks(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).slice(0, 10);
  const parsed = new Date(`${clean}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return clean;

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function formatWaktuUks(timeStr?: string | null): string {
  if (!timeStr) return '-';
  const trimmed = String(timeStr).trim();
  if (!trimmed) return '-';
  const hhmm = trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
  return `${hhmm} WITA`;
}

export function exportLogUksExcel(
  logs: ExportUksRow[],
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

  const totalKunjungan = logs.length;
  const denganObat = logs.filter((item) => {
    const obat = (item.obat_diberikan || item.obat_digunakan || '').trim();
    return obat !== '' && obat !== '-';
  }).length;

  const headers = [
    'No',
    'Tanggal',
    'Waktu',
    'Nama Pasien',
    'Kelas',
    'Keluhan',
    'Tindakan Pertolongan',
    'Obat Diberikan',
    'Petugas Piket',
  ];

  const colCount = headers.length;
  const emptyRow = () => Array(colCount).fill('');

  const sheetMatrix: any[][] = [
    [
      'LOG PELAYANAN UNIT KESEHATAN SEKOLAH (UKS)',
      ...Array(colCount - 1).fill(''),
    ],
    [unitName.toUpperCase(), ...Array(colCount - 1).fill('')],
    [
      `Dicetak: ${nowWita} WITA  |  Total Kunjungan: ${totalKunjungan} Pasien  |  Pemberian Obat: ${denganObat} Kasus${
        options?.filterLabel ? `  |  Filter: ${options.filterLabel}` : ''
      }`,
      ...Array(colCount - 1).fill(''),
    ],
    emptyRow(), // Baris 4 spasi
    headers,    // Baris 5 header tabel
  ];

  const HEADER_ROW_IDX = 4;
  const FIRST_DATA_ROW_IDX = 5;

  logs.forEach((item, idx) => {
    const obatRaw = (item.obat_diberikan || item.obat_digunakan || '').trim();
    const obatLabel = obatRaw || '-';
    const petugasLabel = item.petugas?.nama
      ? item.petugas.jabatan
        ? `${item.petugas.nama} (${item.petugas.jabatan})`
        : item.petugas.nama
      : '-';

    sheetMatrix.push([
      idx + 1,
      formatTanggalUks(item.tanggal),
      formatWaktuUks(item.waktu),
      item.nama_pasien || '-',
      item.kelas_pasien || '-',
      item.keluhan || '-',
      item.tindakan || '-',
      obatLabel,
      petugasLabel,
    ]);
  });

  const LAST_DATA_ROW_IDX = FIRST_DATA_ROW_IDX + logs.length - 1;
  const TOTAL_ROW_IDX = LAST_DATA_ROW_IDX + 1;

  // Baris rekap bawah tabel
  sheetMatrix.push([
    'TOTAL KUNJUNGAN PELAYANAN UKS TERCATAT',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `${totalKunjungan} Pasien`,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetMatrix);

  // Merge Kop Dokumen (Baris 1-3) & Label Total Bawah (Kolom A-H)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: TOTAL_ROW_IDX, c: 0 }, e: { r: TOTAL_ROW_IDX, c: colCount - 2 } },
  ];

  // Style Kop Dokumen (Baris 1-3)
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
        border: { bottom: { style: 'thin', color: { rgb: 'FECACA' } } },
      };
    }
  }

  // Style Header Tabel (Baris 5)
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

  const CENTER_COLS = new Set([0, 1, 2, 4]);
  const WRAP_COLS = new Set([5, 6, 7]);

  // Style Isi Log Pelayanan UKS
  for (let r = FIRST_DATA_ROW_IDX; r <= LAST_DATA_ROW_IDX; r++) {
    const isEvenRow = (r - HEADER_ROW_IDX) % 2 === 0;
    const baseFill = isEvenRow ? 'FFF8F8' : 'FFFFFF';

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      const rawVal = String(ws[addr].v ?? '').trim();
      let cellFill = baseFill;
      let fontColor = '1E293B';
      let isBold = c === 3; // Tebalkan Nama Pasien
      let horizontal: 'left' | 'center' = CENTER_COLS.has(c) ? 'center' : 'left';

      // Highlight lembut pada kolom Obat Diberikan (index 7) jika ada obat
      if (c === 7) {
        if (rawVal !== '' && rawVal !== '-') {
          cellFill = 'E0F2FE';
          fontColor = '0369A1';
          isBold = true;
        } else {
          horizontal = 'center';
          fontColor = '94A3B8';
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
          horizontal,
          vertical: 'center',
          indent: horizontal === 'left' ? 1 : 0,
          wrapText: WRAP_COLS.has(c),
        },
        border: BORDER_THIN,
      };
    }
  }

  // Style Baris Total Bawah
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: TOTAL_ROW_IDX, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };

    ws[addr].s = {
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '7F1D1D' } },
      fill: { fgColor: { rgb: 'FEE2E2' } },
      alignment: {
        horizontal: c === colCount - 1 ? 'center' : 'right',
        vertical: 'center',
        indent: c === colCount - 1 ? 0 : 1,
      },
      border: BORDER_TOTAL,
    };
  }

  // Tinggi baris (otomatis menyesuaikan jika keluhan/tindakan panjang)
  const dataRowHeights = logs.map((item) => {
    const maxTextLen = Math.max(
      String(item.keluhan || '').length,
      String(item.tindakan || '').length,
      String(item.obat_diberikan || item.obat_digunakan || '').length
    );
    const estimatedLines = Math.max(1, Math.ceil(maxTextLen / 30));
    return { hpt: Math.max(22, estimatedLines * 15) };
  });

  ws['!rows'] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 19 },
    { hpt: 10 },
    { hpt: 28 },
    ...dataRowHeights,
    { hpt: 25 },
  ];

  // Lebar kolom
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 15 }, // Tanggal
    { wch: 13 }, // Waktu
    { wch: 24 }, // Nama Pasien
    { wch: 13 }, // Kelas
    { wch: 28 }, // Keluhan
    { wch: 30 }, // Tindakan Pertolongan
    { wch: 22 }, // Obat Diberikan
    { wch: 23 }, // Petugas Piket
  ];

  // AutoFilter pada header tabel
  if (logs.length > 0) {
    const lastColLetter = XLSX.utils.encode_col(colCount - 1);
    const lastExcelRow = LAST_DATA_ROW_IDX + 1;
    ws['!autofilter'] = {
      ref: `A5:${lastColLetter}${lastExcelRow}`,
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Log Pelayanan UKS');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Log_Pelayanan_UKS_PMR_Wira_${today}.xlsx`);
}