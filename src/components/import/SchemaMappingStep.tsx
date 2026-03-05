import { ColumnMapping, ParsedFile, TransformationType } from '@/lib/types';
import { STANDARD_COLUMNS } from '@/lib/standardSchema';
import { autoMapColumns } from '@/lib/heuristicMapper';
import { motion } from 'framer-motion';
import { Wand2, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface SchemaMappingStepProps {
  parsedFile: ParsedFile;
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  requiredFields: string[];
  onRequiredFieldsChange: (fields: string[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const TRANSFORMATIONS: { value: TransformationType; label: string }[] = [
  { value: 'none', label: 'Nessuna' },
  { value: 'trim', label: 'Trim spazi' },
  { value: 'uppercase', label: 'MAIUSCOLO' },
  { value: 'lowercase', label: 'minuscolo' },
  { value: 'capitalize', label: 'Capitalizza' },
  { value: 'split_fullname', label: 'Dividi Nome/Cognome' },
  { value: 'normalize_phone', label: 'Normalizza telefono' },
  { value: 'extract_email', label: 'Estrai email' },
  { value: 'parse_cap', label: 'Parsa CAP' },
  { value: 'parse_country', label: 'Parsa nazione' },
  { value: 'parse_date', label: 'Parsa data' },
];

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <CheckCircle2 className="h-3 w-3" />
        {confidence}%
      </span>
    );
  }
  if (confidence >= 50) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
        <AlertTriangle className="h-3 w-3" />
        {confidence}%
      </span>
    );
  }
  if (confidence > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <HelpCircle className="h-3 w-3" />
        {confidence}%
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

export default function SchemaMappingStep({
  parsedFile,
  mappings,
  onMappingsChange,
  requiredFields,
  onRequiredFieldsChange,
  onConfirm,
  onBack,
}: SchemaMappingStepProps) {
  const [showSchema, setShowSchema] = useState(false);

  const handleAutoMap = () => {
    const auto = autoMapColumns(parsedFile.headers, parsedFile.sampleRows);
    onMappingsChange(auto);
  };

  const updateMapping = (index: number, field: keyof ColumnMapping, value: string) => {
    const updated = [...mappings];
    if (field === 'targetColumn') {
      // Unmap any other source that was mapped to this target
      updated.forEach((m, i) => {
        if (i !== index && m.targetColumn === value && value !== '') {
          updated[i] = { ...m, targetColumn: '', confidence: 0 };
        }
      });
      updated[index] = { ...updated[index], [field]: value, confidence: value ? 100 : 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onMappingsChange(updated);
  };

  const mappedTargets = new Set(mappings.filter(m => m.targetColumn).map(m => m.targetColumn));
  const unmappedRequired = requiredFields.filter(f => !mappedTargets.has(f));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Mapping colonne</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Associa le colonne del file alle colonne standard di destinazione
          </p>
        </div>
        <button
          onClick={handleAutoMap}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Wand2 className="h-4 w-4" />
          Auto-mappa
        </button>
      </div>

      {/* Required fields config */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Campi obbligatori</h3>
        <div className="flex flex-wrap gap-2">
          {STANDARD_COLUMNS.map(col => (
            <label
              key={col.key}
              className={`
                inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all border
                ${requiredFields.includes(col.key)
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-muted/50 border-transparent text-muted-foreground hover:border-border'
                }
              `}
            >
              <input
                type="checkbox"
                checked={requiredFields.includes(col.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onRequiredFieldsChange([...requiredFields, col.key]);
                  } else {
                    onRequiredFieldsChange(requiredFields.filter(f => f !== col.key));
                  }
                }}
                className="sr-only"
              />
              {col.label}
            </label>
          ))}
        </div>
      </div>

      {unmappedRequired.length > 0 && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          Campi obbligatori non mappati: {unmappedRequired.map(f => STANDARD_COLUMNS.find(c => c.key === f)?.label || f).join(', ')}
        </div>
      )}

      {/* Mapping table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-3 text-left">Colonna file</th>
                <th className="px-4 py-3 text-left">Esempi</th>
                <th className="px-4 py-3 text-left">→ Colonna destinazione</th>
                <th className="px-4 py-3 text-left">Trasformazione</th>
                <th className="px-4 py-3 text-center">Confidenza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mappings.map((mapping, i) => {
                const examples = parsedFile.sampleRows
                  .slice(0, 3)
                  .map(r => r[mapping.sourceIndex])
                  .filter(v => v?.trim());

                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={mapping.targetColumn ? 'bg-card' : 'bg-muted/20'}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {mapping.sourceColumn}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {examples.slice(0, 3).map((ex, j) => (
                          <span key={j} className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-mono truncate max-w-[120px]" title={ex}>
                            {ex}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping.targetColumn}
                        onChange={(e) => updateMapping(i, 'targetColumn', e.target.value)}
                        className={`w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ${
                          !mapping.targetColumn ? 'text-muted-foreground' : ''
                        }`}
                      >
                        <option value="">— Non mappare —</option>
                        {STANDARD_COLUMNS.map(col => (
                          <option
                            key={col.key}
                            value={col.key}
                            disabled={mappedTargets.has(col.key) && mapping.targetColumn !== col.key}
                          >
                            {col.label} ({col.key})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping.transformation}
                        onChange={(e) => updateMapping(i, 'transformation' as any, e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      >
                        {TRANSFORMATIONS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ConfidenceBadge confidence={mapping.confidence} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema JSON toggle */}
      <div>
        <button
          onClick={() => setShowSchema(!showSchema)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showSchema ? '▾ Nascondi' : '▸ Mostra'} tracciato record (JSON)
        </button>
        {showSchema && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 rounded-lg bg-primary/5 border border-border p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto"
          >
            {JSON.stringify(
              {
                mappings: mappings.filter(m => m.targetColumn),
                requiredFields,
                generatedAt: new Date().toISOString(),
              },
              null,
              2
            )}
          </motion.pre>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          ← Indietro
        </button>
        <button
          onClick={onConfirm}
          disabled={mappings.filter(m => m.targetColumn).length === 0}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          Valida e Importa →
        </button>
      </div>
    </div>
  );
}
