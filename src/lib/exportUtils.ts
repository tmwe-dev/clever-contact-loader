import * as XLSX from 'xlsx';
import { RejectedRow } from './types';

export function exportRejectedToXlsx(
  rejectedRows: RejectedRow[],
  headers: string[],
  jobId: string
): void {
  const wsData: string[][] = [];

  // Header row
  wsData.push([...headers, 'MotivoScarto']);

  // Data rows
  for (const row of rejectedRows) {
    wsData.push([...row.originalData, row.reasons.join('; ')]);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scarti');

  // Style header
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true } };
    }
  }

  // Auto-width
  const colWidths = wsData[0].map((_, i) => {
    const maxLen = Math.max(...wsData.map(row => (row[i] || '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `scarti_${jobId}.xlsx`);
}
