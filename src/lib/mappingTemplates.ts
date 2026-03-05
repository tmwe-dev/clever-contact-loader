import { ColumnMapping } from './types';

const STORAGE_KEY = 'mapping_templates';

export interface MappingTemplate {
  id: string;
  name: string;
  sourceHeaders: string[];
  mappings: ColumnMapping[];
  requiredFields: string[];
  savedAt: string;
  usageCount: number;
}

function loadTemplates(): MappingTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTemplates(templates: MappingTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.slice(0, 30)));
}

/** Save current mapping as a reusable template */
export function saveMappingTemplate(
  name: string,
  sourceHeaders: string[],
  mappings: ColumnMapping[],
  requiredFields: string[]
): MappingTemplate {
  const templates = loadTemplates();
  const template: MappingTemplate = {
    id: Math.random().toString(36).slice(2, 10),
    name,
    sourceHeaders: [...sourceHeaders],
    mappings: mappings.filter(m => m.targetColumn),
    requiredFields: [...requiredFields],
    savedAt: new Date().toISOString(),
    usageCount: 0,
  };

  // Replace if same headers already exist
  const existingIdx = templates.findIndex(t => headersMatch(t.sourceHeaders, sourceHeaders));
  if (existingIdx >= 0) {
    template.id = templates[existingIdx].id;
    template.usageCount = templates[existingIdx].usageCount;
    templates[existingIdx] = template;
  } else {
    templates.unshift(template);
  }

  saveTemplates(templates);
  return template;
}

/** Find a saved template that matches the given headers */
export function findMatchingTemplate(sourceHeaders: string[]): MappingTemplate | null {
  const templates = loadTemplates();
  // Exact match first
  const exact = templates.find(t => headersMatch(t.sourceHeaders, sourceHeaders));
  if (exact) return exact;

  // Fuzzy match: at least 80% of headers match
  const best = templates
    .map(t => ({ template: t, score: headerOverlap(t.sourceHeaders, sourceHeaders) }))
    .filter(x => x.score >= 0.8)
    .sort((a, b) => b.score - a.score)[0];

  return best?.template || null;
}

/** Increment usage count for a template */
export function useTemplate(templateId: string) {
  const templates = loadTemplates();
  const t = templates.find(x => x.id === templateId);
  if (t) {
    t.usageCount++;
    saveTemplates(templates);
  }
}

/** Rebuild mappings from a template for new headers (handles index shifts) */
export function applyTemplate(template: MappingTemplate, newHeaders: string[]): ColumnMapping[] {
  return newHeaders.map((header, idx) => {
    const saved = template.mappings.find(m => m.sourceColumn.toLowerCase().trim() === header.toLowerCase().trim());
    return {
      sourceColumn: header,
      sourceIndex: idx,
      targetColumn: saved?.targetColumn || '',
      confidence: saved ? 95 : 0,
      transformation: saved?.transformation || 'none',
    };
  });
}

export function getAllTemplates(): MappingTemplate[] {
  return loadTemplates();
}

export function deleteTemplate(id: string) {
  saveTemplates(loadTemplates().filter(t => t.id !== id));
}

function headersMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (s: string) => s.toLowerCase().trim();
  return a.every((h, i) => norm(h) === norm(b[i]));
}

function headerOverlap(saved: string[], incoming: string[]): number {
  const norm = (s: string) => s.toLowerCase().trim();
  const set = new Set(saved.map(norm));
  const matches = incoming.filter(h => set.has(norm(h))).length;
  return matches / Math.max(saved.length, incoming.length);
}
