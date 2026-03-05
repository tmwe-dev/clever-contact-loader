export interface StandardColumn {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'email' | 'phone' | 'number' | 'date';
  description?: string;
}

export interface ParsedFile {
  headers: string[];
  rows: string[][];
  totalRows: number;
  sampleRows: string[][];
  detectedFormat: 'csv' | 'xlsx' | 'xls' | 'txt';
}

export interface ParsingOptions {
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
  quoteChar: string;
  skipRows: number;
  decimalChar: string;
  selectedSheet?: string;
  sheets?: string[];
}

export interface ColumnMapping {
  sourceColumn: string;
  sourceIndex: number;
  targetColumn: string;
  confidence: number;
  transformation: TransformationType;
}

export type TransformationType =
  | 'none'
  | 'trim'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'split_fullname'
  | 'parse_cap'
  | 'parse_country'
  | 'normalize_phone'
  | 'parse_date'
  | 'extract_email';

export interface ValidationResult {
  validRows: Record<string, string>[];
  rejectedRows: RejectedRow[];
  stats: ImportStats;
}

export interface RejectedRow {
  rowIndex: number;
  originalData: string[];
  reasons: string[];
  mappedData?: Record<string, string>;
}

export interface ImportStats {
  totalRows: number;
  importedCount: number;
  rejectedCount: number;
}

export type ImportStatus = 'uploaded' | 'parsing' | 'mapping' | 'validating' | 'importing' | 'done' | 'failed';

export interface ImportJob {
  id: string;
  filename: string;
  status: ImportStatus;
  createdAt: Date;
  finishedAt?: Date;
  detectedFormat: string;
  parsingOptions: ParsingOptions;
  mappingSchema: ColumnMapping[];
  stats?: ImportStats;
  rejectedRows?: RejectedRow[];
  parsedFile?: ParsedFile;
  validRows?: Record<string, string>[];
}
