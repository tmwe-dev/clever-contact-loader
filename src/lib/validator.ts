import { ColumnMapping, ValidationResult, RejectedRow, TransformationType } from './types';
import { STANDARD_COLUMNS } from './standardSchema';

function applyTransformation(value: string, transformation: TransformationType): string {
  const trimmed = (value ?? '').trim();
  switch (transformation) {
    case 'trim': return trimmed;
    case 'uppercase': return trimmed.toUpperCase();
    case 'lowercase': return trimmed.toLowerCase();
    case 'capitalize':
      return trimmed.replace(/\b\w/g, c => c.toUpperCase());
    case 'normalize_phone':
      return normalizePhone(trimmed);
    case 'extract_email':
      return extractEmail(trimmed);
    case 'parse_cap':
      return parseCap(trimmed);
    case 'parse_country':
      return parseCountry(trimmed);
    case 'parse_date':
      return parseDate(trimmed);
    default:
      return trimmed;
  }
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.match(/^3\d{8,9}$/)) cleaned = '+39' + cleaned;
  if (cleaned.match(/^0\d{6,10}$/)) cleaned = '+39' + cleaned;
  return cleaned;
}

function extractEmail(value: string): string {
  const match = value.match(/[\w.\-+]+@[\w.\-]+\.\w{2,}/);
  return match ? match[0].toLowerCase() : value.toLowerCase();
}

function parseCap(value: string): string {
  const match = value.match(/\d{5}/);
  return match ? match[0] : value;
}

const COUNTRY_MAP: Record<string, string> = {
  'italia': 'IT', 'italy': 'IT', 'it': 'IT', 'ita': 'IT',
  'germania': 'DE', 'germany': 'DE', 'de': 'DE', 'deu': 'DE',
  'francia': 'FR', 'france': 'FR', 'fr': 'FR', 'fra': 'FR',
  'spagna': 'ES', 'spain': 'ES', 'es': 'ES', 'esp': 'ES',
  'regno unito': 'GB', 'united kingdom': 'GB', 'uk': 'GB', 'gb': 'GB',
  'stati uniti': 'US', 'united states': 'US', 'usa': 'US', 'us': 'US',
  'svizzera': 'CH', 'switzerland': 'CH', 'ch': 'CH',
  'austria': 'AT', 'at': 'AT', 'aut': 'AT',
};

function parseCountry(value: string): string {
  const norm = value.toLowerCase().trim();
  return COUNTRY_MAP[norm] || (value.length === 2 ? value.toUpperCase() : value);
}

function parseDate(value: string): string {
  // Try dd/mm/yyyy or dd-mm-yyyy
  const match = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return value;
}

function validateEmail(email: string): boolean {
  return /^[\w.\-+]+@[\w.\-]+\.\w{2,}$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s\-]/g, ''));
}

function validateCap(cap: string): boolean {
  return /^\d{5}$/.test(cap);
}

export function validateAndTransform(
  rows: string[][],
  mappings: ColumnMapping[],
  requiredFields: string[]
): ValidationResult {
  const validRows: Record<string, string>[] = [];
  const rejectedRows: RejectedRow[] = [];
  const activeMappings = mappings.filter(m => m.targetColumn);

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const mapped: Record<string, string> = {};
    const reasons: string[] = [];

    // Apply mappings
    for (const mapping of activeMappings) {
      const rawValue = row[mapping.sourceIndex] ?? '';

      if (mapping.transformation === 'split_fullname') {
        const parts = rawValue.trim().split(/\s+/);
        if (mapping.targetColumn === 'first_name') {
          mapped['first_name'] = parts[0] || '';
          if (parts.length > 1) {
            mapped['last_name'] = parts.slice(1).join(' ');
          }
        } else if (mapping.targetColumn === 'last_name') {
          mapped['last_name'] = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '';
          if (parts.length > 1) {
            mapped['first_name'] = parts[0] || '';
          }
        }
      } else {
        mapped[mapping.targetColumn] = applyTransformation(rawValue, mapping.transformation);
      }
    }

    // Validate required fields
    for (const field of requiredFields) {
      if (!mapped[field]?.trim()) {
        const col = STANDARD_COLUMNS.find(c => c.key === field);
        reasons.push(`Campo obbligatorio mancante: ${col?.label || field}`);
      }
    }

    // Validate specific field types
    if (mapped.email && mapped.email.trim() && !validateEmail(mapped.email)) {
      reasons.push(`Email non valida: "${mapped.email}"`);
    }
    // Always try to normalize phone before validating
    if (mapped.phone && mapped.phone.trim()) {
      mapped.phone = normalizePhone(mapped.phone);
      if (!validatePhone(mapped.phone)) {
        // Accept it anyway with a best-effort normalization — don't reject
        // Only reject if it's completely garbage (less than 6 digits)
        const digitCount = mapped.phone.replace(/\D/g, '').length;
        if (digitCount < 6) {
          reasons.push(`Telefono non valido: "${mapped.phone}" (troppo corto)`);
        }
      }
    }
    if (mapped.postal_code && mapped.postal_code.trim() && !validateCap(mapped.postal_code)) {
      reasons.push(`CAP non valido: "${mapped.postal_code}"`);
    }

    // Check if row has any meaningful data
    const hasData = Object.values(mapped).some(v => v?.trim());
    if (!hasData) {
      reasons.push('Riga vuota: nessun dato significativo');
    }

    if (reasons.length > 0) {
      rejectedRows.push({ rowIndex: rowIdx + 1, originalData: row, reasons, mappedData: mapped });
    } else {
      validRows.push(mapped);
    }
  }

  return {
    validRows,
    rejectedRows,
    stats: {
      totalRows: rows.length,
      importedCount: validRows.length,
      rejectedCount: rejectedRows.length,
    },
  };
}
