import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedFile, ParsingOptions } from './types';

const SAMPLE_SIZE = 50;

function detectDelimiter(text: string): string {
  const lines = text.split('\n').slice(0, 10);
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: lines.reduce((sum, line) => sum + (line.split(d).length - 1), 0),
    consistency: new Set(lines.map(line => line.split(d).length)).size,
  }));
  counts.sort((a, b) => a.consistency - b.consistency || b.count - a.count);
  return counts[0]?.delimiter || ',';
}

function detectHeader(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  const first = rows[0];
  const rest = rows.slice(1, 6);
  // If first row has more non-numeric values compared to rest, likely header
  const firstNonNumeric = first.filter(v => isNaN(Number(v)) && v.trim() !== '').length;
  const avgNonNumeric = rest.reduce((sum, row) => {
    return sum + row.filter(v => isNaN(Number(v)) && v.trim() !== '').length;
  }, 0) / rest.length;
  // If first row is mostly text and data rows have numbers, it's a header
  if (firstNonNumeric > avgNonNumeric + 1) return true;
  // Check if first row values are unique compared to data patterns
  const firstTypes = first.map(v => typeof v === 'string' && v.match(/^[a-zA-Z_\s]+$/) ? 'text' : 'data');
  const textRatio = firstTypes.filter(t => t === 'text').length / firstTypes.length;
  return textRatio > 0.6;
}

function generateAutoHeaders(colCount: number): string[] {
  return Array.from({ length: colCount }, (_, i) => {
    const letter = String.fromCharCode(65 + (i % 26));
    const prefix = i >= 26 ? String.fromCharCode(65 + Math.floor(i / 26) - 1) : '';
    return `Colonna ${prefix}${letter}`;
  });
}

export async function parseFile(
  file: File,
  optionsOverride?: Partial<ParsingOptions>
): Promise<{ parsed: ParsedFile; options: ParsingOptions }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (['xlsx', 'xls'].includes(ext)) {
    return parseExcel(file, optionsOverride);
  }
  return parseCsvTxt(file, ext === 'txt' ? 'txt' : 'csv', optionsOverride);
}

async function parseCsvTxt(
  file: File,
  format: 'csv' | 'txt',
  optionsOverride?: Partial<ParsingOptions>
): Promise<{ parsed: ParsedFile; options: ParsingOptions }> {
  const encoding = optionsOverride?.encoding || 'utf-8';
  const text = await readFileAsText(file, encoding);

  const delimiter = optionsOverride?.delimiter || detectDelimiter(text);
  const quoteChar = optionsOverride?.quoteChar || '"';
  const skipRows = optionsOverride?.skipRows || 0;

  const result = Papa.parse(text, {
    delimiter,
    quoteChar,
    skipEmptyLines: true,
  });

  let rows = (result.data as string[][]).slice(skipRows);
  if (rows.length === 0) {
    throw new Error('Il file è vuoto o non contiene dati validi.');
  }

  const hasHeader = optionsOverride?.hasHeader ?? detectHeader(rows);
  let headers: string[];

  if (hasHeader) {
    headers = rows[0].map((h, i) => (h?.trim() || `Colonna ${i + 1}`));
    rows = rows.slice(1);
  } else {
    headers = generateAutoHeaders(rows[0]?.length || 0);
  }

  // Normalize row lengths
  const colCount = headers.length;
  rows = rows.map(row => {
    if (row.length < colCount) return [...row, ...Array(colCount - row.length).fill('')];
    if (row.length > colCount) return row.slice(0, colCount);
    return row;
  }).filter(row => row.some(cell => cell?.trim()));

  const sampleIndices = getSampleIndices(rows.length, SAMPLE_SIZE);
  const sampleRows = sampleIndices.map(i => rows[i]);

  const options: ParsingOptions = {
    delimiter,
    encoding,
    hasHeader,
    quoteChar,
    skipRows,
    decimalChar: optionsOverride?.decimalChar || '.',
  };

  return {
    parsed: {
      headers,
      rows,
      totalRows: rows.length,
      sampleRows,
      detectedFormat: format === 'txt' ? 'txt' : 'csv',
    },
    options,
  };
}

async function parseExcel(
  file: File,
  optionsOverride?: Partial<ParsingOptions>
): Promise<{ parsed: ParsedFile; options: ParsingOptions }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets = workbook.SheetNames;
  const selectedSheet = optionsOverride?.selectedSheet || sheets[0];
  const sheet = workbook.Sheets[selectedSheet];

  if (!sheet) throw new Error(`Foglio "${selectedSheet}" non trovato.`);

  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const skipRows = optionsOverride?.skipRows || 0;
  let rows = rawData.slice(skipRows).filter(row => row.some(cell => String(cell).trim()));

  if (rows.length === 0) throw new Error('Il foglio è vuoto.');

  const hasHeader = optionsOverride?.hasHeader ?? detectHeader(rows);
  let headers: string[];

  if (hasHeader) {
    headers = rows[0].map((h, i) => (String(h)?.trim() || `Colonna ${i + 1}`));
    rows = rows.slice(1);
  } else {
    headers = generateAutoHeaders(rows[0]?.length || 0);
  }

  const colCount = headers.length;
  rows = rows.map(row => {
    const strRow = row.map(c => String(c ?? ''));
    if (strRow.length < colCount) return [...strRow, ...Array(colCount - strRow.length).fill('')];
    if (strRow.length > colCount) return strRow.slice(0, colCount);
    return strRow;
  });

  const sampleIndices = getSampleIndices(rows.length, SAMPLE_SIZE);
  const sampleRows = sampleIndices.map(i => rows[i]);

  const options: ParsingOptions = {
    delimiter: '',
    encoding: 'binary',
    hasHeader,
    quoteChar: '"',
    skipRows,
    decimalChar: '.',
    selectedSheet,
    sheets,
  };

  return {
    parsed: {
      headers,
      rows,
      totalRows: rows.length,
      sampleRows,
      detectedFormat: file.name.endsWith('.xls') ? 'xls' : 'xlsx',
    },
    options,
  };
}

function readFileAsText(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Errore nella lettura del file.'));
    reader.readAsText(file, encoding);
  });
}

function getSampleIndices(total: number, sampleSize: number): number[] {
  if (total <= sampleSize) return Array.from({ length: total }, (_, i) => i);
  const step = total / sampleSize;
  return Array.from({ length: sampleSize }, (_, i) => Math.min(Math.floor(i * step), total - 1));
}
