import { ColumnMapping, TransformationType } from './types';
import { STANDARD_COLUMNS } from './standardSchema';

// Italian synonym dictionary for heuristic matching
const SYNONYMS: Record<string, string[]> = {
  first_name: ['nome', 'first_name', 'firstname', 'first name', 'nome di battesimo', 'name'],
  last_name: ['cognome', 'last_name', 'lastname', 'last name', 'surname', 'family name'],
  company: ['azienda', 'company', 'ditta', 'ragione sociale', 'rag. sociale', 'rag sociale', 'società', 'societa', 'impresa', 'denominazione'],
  email: ['email', 'e-mail', 'mail', 'posta elettronica', 'indirizzo email', 'pec'],
  phone: ['telefono', 'phone', 'tel', 'cellulare', 'cell', 'mobile', 'tel.', 'numero telefono', 'n. telefono', 'recapito'],
  street: ['indirizzo', 'via', 'street', 'address', 'piazza', 'corso', 'viale', 'strada', 'loc.', 'località'],
  street_number: ['civico', 'n. civico', 'numero civico', 'street_number', 'num', 'n.', 'nr', 'numero'],
  city: ['città', 'citta', 'city', 'comune', 'localita', 'località', 'town'],
  province: ['provincia', 'province', 'prov', 'prov.', 'sigla provincia', 'state'],
  postal_code: ['cap', 'postal_code', 'zip', 'zipcode', 'zip code', 'codice postale', 'c.a.p.', 'codice avviamento'],
  country: ['nazione', 'country', 'stato', 'paese', 'nation', 'cod. nazione', 'codice nazione'],
  notes: ['note', 'notes', 'annotazioni', 'commento', 'commenti', 'osservazioni', 'descrizione'],
};

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similarity(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;

  // Levenshtein-based similarity
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(normA, normB);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function detectTransformation(sourceHeader: string, targetKey: string, sampleValues: string[]): TransformationType {
  // Check if source looks like a full name and target is first/last
  const normSource = normalizeString(sourceHeader);
  if ((targetKey === 'first_name' || targetKey === 'last_name') &&
    (normSource.includes('nome e cognome') || normSource.includes('nominativo') || normSource === 'nome completo')) {
    return 'split_fullname';
  }
  if (targetKey === 'phone') return 'normalize_phone';
  if (targetKey === 'email') return 'extract_email';
  if (targetKey === 'postal_code') return 'parse_cap';
  if (targetKey === 'country') return 'parse_country';
  return 'trim';
}

export function autoMapColumns(
  sourceHeaders: string[],
  sampleRows: string[][]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  // For each source column, find best matching target
  for (let i = 0; i < sourceHeaders.length; i++) {
    const sourceHeader = sourceHeaders[i];
    const normSource = normalizeString(sourceHeader);
    let bestMatch = '';
    let bestScore = 0;

    for (const col of STANDARD_COLUMNS) {
      if (usedTargets.has(col.key)) continue;

      // Check synonyms
      const synonyms = SYNONYMS[col.key] || [];
      let score = 0;

      for (const syn of synonyms) {
        const synScore = similarity(normSource, normalizeString(syn));
        score = Math.max(score, synScore);
      }

      // Also check direct similarity with key and label
      score = Math.max(score, similarity(normSource, normalizeString(col.key)));
      score = Math.max(score, similarity(normSource, normalizeString(col.label)));

      if (score > bestScore) {
        bestScore = score;
        bestMatch = col.key;
      }
    }

    if (bestScore >= 0.5 && bestMatch) {
      const sampleValues = sampleRows.map(r => r[i] || '');
      usedTargets.add(bestMatch);
      mappings.push({
        sourceColumn: sourceHeader,
        sourceIndex: i,
        targetColumn: bestMatch,
        confidence: Math.round(bestScore * 100),
        transformation: detectTransformation(sourceHeader, bestMatch, sampleValues),
      });
    } else {
      mappings.push({
        sourceColumn: sourceHeader,
        sourceIndex: i,
        targetColumn: '',
        confidence: 0,
        transformation: 'none',
      });
    }
  }

  return mappings;
}
