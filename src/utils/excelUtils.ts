import * as XLSX from 'xlsx';

/** Export an array-of-arrays (first row = headers) to a .xlsx file */
export function exportToExcel(rows: unknown[][], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** Download a sample Excel file with headers and one example row */
export function downloadSampleExcel(
  headers: string[],
  sampleRow: unknown[],
  filename: string,
) {
  exportToExcel([headers, sampleRow], filename);
}

/** Parse an uploaded .xlsx / .xls file and return rows as plain objects */
export async function parseExcelFile(
  file: File,
): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const wb     = XLSX.read(buffer, { type: 'array' });
  const ws     = wb.Sheets[wb.SheetNames[0]!];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: '',
    raw:    false, // return everything as strings
  });
}
