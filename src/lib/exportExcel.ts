import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T | ((row: T, index: number) => string | number);
  width?: number;
}

export function exportToExcel<T>(
  filename: string,
  sheetName: string,
  rows: T[],
  columns: ExcelColumn<T>[]
): void {
  const formattedData = rows.map((row, idx) => {
    const record: Record<string, string | number> = {};
    columns.forEach((col) => {
      record[col.header] =
        typeof col.key === 'function'
          ? col.key(row, idx)
          : ((row[col.key] as unknown as string | number) ?? '-');
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width || 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const safeDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}_${safeDate}.xlsx`);
}