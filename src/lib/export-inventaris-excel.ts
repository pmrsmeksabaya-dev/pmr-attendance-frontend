import XLSX from 'xlsx-js-style';

export interface ExportInventarisRow {
  id?: number;
  kode_barang?: string | null;
  nama_barang: string;
  kategori?: string | null;
  jumlah_total?: number | string | null;
  jumlah_baik?: number | string | null;
  jumlah_rusak?: number | string | null;
  lokasi_simpan?: string | null;
  catatan?: string | null;
  keterangan?: string | null;
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

export function exportInventarisExcel(
  items: ExportInventarisRow[],
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

  let totalUnit = 0;
  let totalBaik = 0;
  let totalRusak = 0;

  for (const item of items) {
    const baik = Number(item.jumlah_baik || 0);
    const rusak = Number(item.jumlah_rusak || 0);
    const total =
      item.jumlah_total !== undefined && item.jumlah_total !== null
        ? Number(item.jumlah_total)
        : baik + rusak;

    totalBaik += baik;
    totalRusak += rusak;
    totalUnit += total;
  }

  const headers = [
    'No',
    'Kode Barang',
    'Nama Barang / Perlengkapan',
    'Kategori',
    'Total Unit',
    'Kondisi Baik',
    'Kondisi Rusak',
    'Lokasi Penyimpanan',
    'Catatan',
  ];

  const colCount = headers.length;
  const emptyRow = () => Array(colCount).fill('');

  const sheetMatrix: any[][] = [
    [
      'DAFTAR INVENTARIS LOGISTIK & PERLENGKAPAN PMR',
      ...Array(colCount - 1).fill(''),
    ],
    [unitName.toUpperCase(), ...Array(colCount - 1).fill('')],
    [
      `Dicetak: ${nowWita} WITA  |  Jenis Barang: ${items.length} Item  |  Total Unit: ${totalUnit}  |  Baik: ${totalBaik}  |  Rusak: ${totalRusak}${
        options?.filterLabel ? `  |  Filter: ${options.filterLabel}` : ''
      }`,
      ...Array(colCount - 1).fill(''),
    ],
    emptyRow(), // Baris 4 spasi
    headers,    // Baris 5 header tabel
  ];

  const HEADER_ROW_IDX = 4;
  const FIRST_DATA_ROW_IDX = 5;

  items.forEach((item, idx) => {
    const baik = Number(item.jumlah_baik || 0);
    const rusak = Number(item.jumlah_rusak || 0);
    const total =
      item.jumlah_total !== undefined && item.jumlah_total !== null
        ? Number(item.jumlah_total)
        : baik + rusak;
    const noteText = (item.catatan || item.keterangan || '').trim() || '-';

    sheetMatrix.push([
      idx + 1,
      item.kode_barang ? String(item.kode_barang).trim().toUpperCase() : '-',
      item.nama_barang || '-',
      item.kategori || '-',
      total,
      baik,
      rusak,
      item.lokasi_simpan || '-',
      noteText,
    ]);
  });

  const LAST_DATA_ROW_IDX = FIRST_DATA_ROW_IDX + items.length - 1;
  const TOTAL_ROW_IDX = LAST_DATA_ROW_IDX + 1;

  // Baris rekap total di bawah tabel
  sheetMatrix.push([
    'TOTAL KESELURUHAN INVENTARIS',
    '',
    '',
    '',
    totalUnit,
    totalBaik,
    totalRusak,
    `${items.length} Jenis Barang`,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetMatrix);

  // Merge Kop Dokumen (Baris 1-3) & Baris Total Bawah
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: TOTAL_ROW_IDX, c: 0 }, e: { r: TOTAL_ROW_IDX, c: 3 } },
    { s: { r: TOTAL_ROW_IDX, c: 7 }, e: { r: TOTAL_ROW_IDX, c: 8 } },
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

  const CENTER_COLS = new Set([0, 1, 3, 4, 5, 6]);

  // Style Isi Data Inventaris
  for (let r = FIRST_DATA_ROW_IDX; r <= LAST_DATA_ROW_IDX; r++) {
    const isEvenRow = (r - HEADER_ROW_IDX) % 2 === 0;
    const baseFill = isEvenRow ? 'FFF8F8' : 'FFFFFF';

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      let cellFill = baseFill;
      let fontColor = '1E293B';
      let isBold = c === 1 || c === 2; // Tebalkan Kode Barang & Nama Barang
      let horizontal: 'left' | 'center' = CENTER_COLS.has(c) ? 'center' : 'left';

      // Format angka untuk kolom Total, Baik, Rusak
      if (c === 4 || c === 5 || c === 6) {
        ws[addr].t = 'n';
        ws[addr].z = '#,##0';
      }

      // Kolom Total Unit (E)
      if (c === 4) {
        isBold = true;
        fontColor = '0F172A';
      }

      // Kolom Kondisi Baik (F)
      if (c === 5) {
        const val = Number(ws[addr].v || 0);
        if (val > 0) {
          cellFill = 'DCFCE7';
          fontColor = '166534';
          isBold = true;
        } else {
          fontColor = '94A3B8';
        }
      }

      // Kolom Kondisi Rusak (G)
      if (c === 6) {
        const val = Number(ws[addr].v || 0);
        if (val > 0) {
          cellFill = 'FEE2E2';
          fontColor = '991B1B';
          isBold = true;
        } else {
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
          wrapText: c === 8,
        },
        border: BORDER_THIN,
      };
    }
  }

  // Style Baris Total Bawah dengan Formula SUM
  const firstExcelRow = FIRST_DATA_ROW_IDX + 1;
  const lastExcelRow = LAST_DATA_ROW_IDX + 1;

  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: TOTAL_ROW_IDX, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };

    let horizontal: 'left' | 'center' | 'right' = 'center';
    let fontColor = '7F1D1D';

    if (c <= 3) {
      horizontal = 'right';
    } else if (c === 4) {
      ws[addr].t = 'n';
      ws[addr].z = '#,##0';
      if (items.length > 0) {
        ws[addr].f = `SUM(E${firstExcelRow}:E${lastExcelRow})`;
      }
      fontColor = '0F172A';
    } else if (c === 5) {
      ws[addr].t = 'n';
      ws[addr].z = '#,##0';
      if (items.length > 0) {
        ws[addr].f = `SUM(F${firstExcelRow}:F${lastExcelRow})`;
      }
      fontColor = '166534';
    } else if (c === 6) {
      ws[addr].t = 'n';
      ws[addr].z = '#,##0';
      if (items.length > 0) {
        ws[addr].f = `SUM(G${firstExcelRow}:G${lastExcelRow})`;
      }
      fontColor = totalRusak > 0 ? '991B1B' : '7F1D1D';
    }

    ws[addr].s = {
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: fontColor } },
      fill: { fgColor: { rgb: 'FEE2E2' } },
      alignment: {
        horizontal,
        vertical: 'center',
        indent: c <= 3 ? 1 : 0,
      },
      border: BORDER_TOTAL,
    };
  }

  // Tinggi baris
  const dataRowHeights = items.map((item) => {
    const noteLen = String(item.catatan || item.keterangan || '').length;
    const estimatedLines = Math.max(1, Math.ceil(noteLen / 32));
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
    { wch: 16 }, // Kode Barang
    { wch: 30 }, // Nama Barang
    { wch: 18 }, // Kategori
    { wch: 13 }, // Total Unit
    { wch: 14 }, // Kondisi Baik
    { wch: 14 }, // Kondisi Rusak
    { wch: 22 }, // Lokasi Simpan
    { wch: 32 }, // Catatan
  ];

  // AutoFilter pada header tabel
  if (items.length > 0) {
    const lastColLetter = XLSX.utils.encode_col(colCount - 1);
    ws['!autofilter'] = {
      ref: `A5:${lastColLetter}${lastExcelRow}`,
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventaris PMR');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Inventaris_Logistik_PMR_Wira_${today}.xlsx`);
}