import XLSX from 'xlsx-js-style';

export interface ExportKasRow {
  id?: number;
  tanggal: string;
  jenis?: 'MASUK' | 'KELUAR' | string;
  tipe?: 'MASUK' | 'KELUAR' | string;
  kategori?: string | null;
  keterangan?: string | null;
  nominal: number | string;
  pencatat?: {
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

const RUPIAH_FORMAT = '"Rp" #,##0;-"Rp" #,##0;"-"';
const RUPIAH_SALDO_FORMAT = '"Rp" #,##0;-"Rp" #,##0;"Rp 0"';

function formatTanggalKas(dateStr?: string | null): string {
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

function formatRupiahText(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('id-ID');
  return amount < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
}

export function exportLaporanKasExcel(
  transactions: ExportKasRow[],
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

  // Urutkan kronologis (terlama -> terbaru) agar perhitungan Saldo Berjalan akurat
  const sortedRows = [...transactions].sort((a, b) => {
    const dateA = String(a.tanggal || '').slice(0, 10);
    const dateB = String(b.tanggal || '').slice(0, 10);
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return Number(a.id || 0) - Number(b.id || 0);
  });

  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const item of sortedRows) {
    const jenis = String(item.jenis || item.tipe || 'MASUK').toUpperCase();
    const nom = Number(item.nominal || 0);
    if (jenis === 'KELUAR') totalKeluar += nom;
    else totalMasuk += nom;
  }
  const saldoAkhir = totalMasuk - totalKeluar;

  const headers = [
    'No',
    'Tanggal',
    'Jenis',
    'Kategori',
    'Uraian / Keterangan',
    'Pemasukan (Rp)',
    'Pengeluaran (Rp)',
    'Saldo (Rp)',
    'Dicatat Oleh',
  ];

  const colCount = headers.length;
  const emptyRow = () => Array(colCount).fill('');

  const sheetMatrix: any[][] = [
    [
      'LAPORAN BUKU KAS UMUM PALANG MERAH REMAJA (PMR)',
      ...Array(colCount - 1).fill(''),
    ],
    [unitName.toUpperCase(), ...Array(colCount - 1).fill('')],
    [
      `Dicetak: ${nowWita} WITA  |  Transaksi: ${sortedRows.length}  |  Masuk: ${formatRupiahText(totalMasuk)}  |  Keluar: ${formatRupiahText(totalKeluar)}  |  Saldo: ${formatRupiahText(saldoAkhir)}${
        options?.filterLabel ? `  |  Filter: ${options.filterLabel}` : ''
      }`,
      ...Array(colCount - 1).fill(''),
    ],
    emptyRow(), // Baris 4 spasi
    headers,    // Baris 5 header tabel
  ];

  const HEADER_ROW_IDX = 4;
  const FIRST_DATA_ROW_IDX = 5;
  let runningBalance = 0;

  sortedRows.forEach((item, idx) => {
    const jenis = String(item.jenis || item.tipe || 'MASUK').toUpperCase();
    const nom = Number(item.nominal || 0);
    const masuk = jenis === 'MASUK' ? nom : 0;
    const keluar = jenis === 'KELUAR' ? nom : 0;
    runningBalance += masuk - keluar;

    const pencatatLabel = item.pencatat?.nama
      ? item.pencatat.jabatan
        ? `${item.pencatat.nama} (${item.pencatat.jabatan})`
        : item.pencatat.nama
      : '-';

    sheetMatrix.push([
      idx + 1,
      formatTanggalKas(item.tanggal),
      jenis,
      item.kategori || '-',
      item.keterangan || '-',
      masuk,
      keluar,
      runningBalance,
      pencatatLabel,
    ]);
  });

  const LAST_DATA_ROW_IDX = FIRST_DATA_ROW_IDX + sortedRows.length - 1;
  const TOTAL_ROW_IDX = LAST_DATA_ROW_IDX + 1;

  // Baris Rekap Total di bagian bawah tabel
  sheetMatrix.push([
    'TOTAL MUTASI & SALDO AKHIR KAS',
    '',
    '',
    '',
    '',
    totalMasuk,
    totalKeluar,
    saldoAkhir,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetMatrix);

  // Merge Kop Dokumen (Baris 1-3) & Label Total (Kolom A-E di baris total)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: TOTAL_ROW_IDX, c: 0 }, e: { r: TOTAL_ROW_IDX, c: 4 } },
  ];

  // Style Kop Dokumen
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

  // Style Isi Transaksi + Formula Saldo Berjalan
  for (let r = FIRST_DATA_ROW_IDX; r <= LAST_DATA_ROW_IDX; r++) {
    const excelRowNum = r + 1;
    const isEvenRow = (r - HEADER_ROW_IDX) % 2 === 0;
    const baseFill = isEvenRow ? 'FFF8F8' : 'FFFFFF';
    const jenisVal = String(sheetMatrix[r][2] || '').toUpperCase();

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      let cellFill = baseFill;
      let fontColor = '1E293B';
      let isBold = false;
      let horizontal: 'left' | 'center' | 'right' = 'left';

      if (c === 0 || c === 1) {
        horizontal = 'center';
      }

      // Badge kolom Jenis (MASUK / KELUAR)
      if (c === 2) {
        horizontal = 'center';
        isBold = true;
        if (jenisVal === 'MASUK') {
          cellFill = 'DCFCE7';
          fontColor = '166534';
        } else {
          cellFill = 'FEE2E2';
          fontColor = '991B1B';
        }
      }

      // Kolom Pemasukan (F)
      if (c === 5) {
        horizontal = 'right';
        ws[addr].t = 'n';
        ws[addr].z = RUPIAH_FORMAT;
        if (Number(ws[addr].v) > 0) {
          fontColor = '15803D';
          isBold = true;
        } else {
          fontColor = '94A3B8';
        }
      }

      // Kolom Pengeluaran (G)
      if (c === 6) {
        horizontal = 'right';
        ws[addr].t = 'n';
        ws[addr].z = RUPIAH_FORMAT;
        if (Number(ws[addr].v) > 0) {
          fontColor = 'B91C1C';
          isBold = true;
        } else {
          fontColor = '94A3B8';
        }
      }

      // Kolom Saldo Berjalan (H) dengan Formula Excel dinamis
      if (c === 7) {
        horizontal = 'right';
        isBold = true;
        ws[addr].t = 'n';
        ws[addr].z = RUPIAH_SALDO_FORMAT;
        ws[addr].f =
          r === FIRST_DATA_ROW_IDX
            ? `F${excelRowNum}-G${excelRowNum}`
            : `H${excelRowNum - 1}+F${excelRowNum}-G${excelRowNum}`;
        fontColor = Number(ws[addr].v) < 0 ? 'B91C1C' : '0F172A';
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
          wrapText: c === 4,
        },
        border: BORDER_THIN,
      };
    }
  }

  // Style Baris Total Mutasi & Saldo Akhir
  const firstExcelRow = FIRST_DATA_ROW_IDX + 1;
  const lastExcelRow = LAST_DATA_ROW_IDX + 1;
  const totalExcelRow = TOTAL_ROW_IDX + 1;

  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: TOTAL_ROW_IDX, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };

    let horizontal: 'left' | 'center' | 'right' = 'right';
    let fontColor = '7F1D1D';

    if (c <= 4) {
      horizontal = 'right';
    } else if (c === 5) {
      ws[addr].t = 'n';
      ws[addr].z = RUPIAH_SALDO_FORMAT;
      if (sortedRows.length > 0) {
        ws[addr].f = `SUM(F${firstExcelRow}:F${lastExcelRow})`;
      }
      fontColor = '166534';
    } else if (c === 6) {
      ws[addr].t = 'n';
      ws[addr].z = RUPIAH_SALDO_FORMAT;
      if (sortedRows.length > 0) {
        ws[addr].f = `SUM(G${firstExcelRow}:G${lastExcelRow})`;
      }
      fontColor = '991B1B';
    } else if (c === 7) {
      ws[addr].t = 'n';
      ws[addr].z = RUPIAH_SALDO_FORMAT;
      ws[addr].f = `F${totalExcelRow}-G${totalExcelRow}`;
      fontColor = saldoAkhir < 0 ? 'B91C1C' : '166534';
    } else {
      horizontal = 'center';
    }

    ws[addr].s = {
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: fontColor } },
      fill: { fgColor: { rgb: 'FEE2E2' } },
      alignment: {
        horizontal,
        vertical: 'center',
        indent: c <= 4 ? 1 : 0,
      },
      border: BORDER_TOTAL,
    };
  }

  // Tinggi baris
  ws['!rows'] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 19 },
    { hpt: 10 },
    { hpt: 28 },
    ...sortedRows.map(() => ({ hpt: 22 })),
    { hpt: 25 },
  ];

  // Auto-fit lebar kolom
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 15 }, // Tanggal
    { wch: 12 }, // Jenis
    { wch: 18 }, // Kategori
    { wch: 36 }, // Uraian / Keterangan
    { wch: 18 }, // Pemasukan
    { wch: 18 }, // Pengeluaran
    { wch: 18 }, // Saldo
    { wch: 24 }, // Dicatat Oleh
  ];

  // AutoFilter pada header tabel
  if (sortedRows.length > 0) {
    const lastColLetter = XLSX.utils.encode_col(colCount - 1);
    ws['!autofilter'] = {
      ref: `A5:${lastColLetter}${lastExcelRow}`,
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kas PMR');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Laporan_Kas_PMR_Wira_${today}.xlsx`);
}