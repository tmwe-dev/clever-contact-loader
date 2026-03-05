import { ColumnMapping, ParsedFile, TransformationType, ColumnGroup } from '@/lib/types';
import { STANDARD_COLUMNS, GROUP_META, GROUP_ORDER } from '@/lib/standardSchema';
import { autoMapColumns } from '@/lib/heuristicMapper';
import { MappingTemplate } from '@/lib/mappingTemplates';
import { motion } from 'framer-motion';
import { Wand2, AlertTriangle, CheckCircle2, HelpCircle, X, Info, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SchemaMappingStepProps {
  parsedFile: ParsedFile;
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  requiredFields: string[];
  onRequiredFieldsChange: (fields: string[]) => void;
  onConfirm: () => void;
  onBack: () => void;
  suggestedTemplate?: MappingTemplate | null;
  onSaveTemplate?: () => void;
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
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {confidence}%
      </Badge>
    );
  }
  if (confidence >= 50) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {confidence}%
      </Badge>
    );
  }
  if (confidence > 0) {
    return (
      <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30">
        <HelpCircle className="h-3 w-3 mr-1" />
        {confidence}%
      </Badge>
    );
  }
  return null;
}

function FieldCard({
  stdCol,
  mapping,
  sourceHeaders,
  sampleRows,
  onSelectSource,
  onClearMapping,
  onChangeTransformation,
  isRequired,
}: {
  stdCol: typeof STANDARD_COLUMNS[0];
  mapping: ColumnMapping | undefined;
  sourceHeaders: string[];
  sampleRows: string[][];
  onSelectSource: (sourceColumn: string) => void;
  onClearMapping: () => void;
  onChangeTransformation: (t: TransformationType) => void;
  isRequired: boolean;
}) {
  const [showTransform, setShowTransform] = useState(false);
  const isMapped = !!mapping;
  const sourceIndex = mapping?.sourceIndex;

  const examples = sourceIndex !== undefined
    ? sampleRows.slice(0, 3).map(r => r[sourceIndex]).filter(v => v?.trim())
    : [];

  return (
    <Card className={`transition-all ${isMapped ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header: field name + clear button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{stdCol.label}</span>
              {isRequired && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/50 text-destructive">
                  obbligatorio
                </Badge>
              )}
              {mapping && <ConfidenceBadge confidence={mapping.confidence} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{stdCol.description}</p>
          </div>
          {isMapped && (
            <button
              onClick={onClearMapping}
              className="shrink-0 rounded-full p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Rimuovi associazione"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Source column selector */}
        <select
          value={mapping?.sourceColumn || ''}
          onChange={(e) => onSelectSource(e.target.value)}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            !isMapped ? 'text-muted-foreground' : 'text-foreground font-medium'
          }`}
        >
          <option value="">— Scegli colonna del file —</option>
          {sourceHeaders.map((h, idx) => (
            <option key={idx} value={h}>{h}</option>
          ))}
        </select>

        {/* Data examples */}
        {isMapped && examples.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1">Esempi:</span>
            {examples.map((ex, j) => (
              <span key={j} className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-mono truncate max-w-[140px]" title={ex}>
                {ex}
              </span>
            ))}
          </div>
        )}

        {/* Transformation (collapsible, only if mapped) */}
        {isMapped && (
          <Collapsible open={showTransform} onOpenChange={setShowTransform}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`h-3 w-3 transition-transform ${showTransform ? 'rotate-180' : ''}`} />
              Trasformazione: {TRANSFORMATIONS.find(t => t.value === (mapping?.transformation || 'none'))?.label}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <select
                value={mapping?.transformation || 'none'}
                onChange={(e) => onChangeTransformation(e.target.value as TransformationType)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                {TRANSFORMATIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchemaMappingStep({
  parsedFile,
  mappings,
  onMappingsChange,
  requiredFields,
  onRequiredFieldsChange,
  onConfirm,
  onBack,
  suggestedTemplate,
  onSaveTemplate,
}: SchemaMappingStepProps) {
  const [showSchema, setShowSchema] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAutoMap = () => {
    const auto = autoMapColumns(parsedFile.headers, parsedFile.sampleRows);
    onMappingsChange(auto);
  };

  // Build a lookup: targetColumn -> mapping index
  const targetToIndex = new Map<string, number>();
  mappings.forEach((m, i) => {
    if (m.targetColumn) targetToIndex.set(m.targetColumn, i);
  });

  const handleSelectSource = (targetKey: string, sourceColumn: string) => {
    const updated = [...mappings];

    // If sourceColumn is empty, we're clearing
    if (!sourceColumn) {
      const oldIdx = targetToIndex.get(targetKey);
      if (oldIdx !== undefined) {
        updated[oldIdx] = { ...updated[oldIdx], targetColumn: '', confidence: 0 };
      }
      onMappingsChange(updated);
      return;
    }

    // Find the mapping for this source column
    const sourceIdx = updated.findIndex(m => m.sourceColumn === sourceColumn);
    if (sourceIdx === -1) return;

    // If another target was using this source, clear it
    // (the source can only map to one target)
    if (updated[sourceIdx].targetColumn && updated[sourceIdx].targetColumn !== targetKey) {
      // source is being reassigned — just overwrite
    }

    // If another source was mapped to this target, clear it
    const oldSourceForTarget = targetToIndex.get(targetKey);
    if (oldSourceForTarget !== undefined && oldSourceForTarget !== sourceIdx) {
      updated[oldSourceForTarget] = { ...updated[oldSourceForTarget], targetColumn: '', confidence: 0 };
    }

    updated[sourceIdx] = { ...updated[sourceIdx], targetColumn: targetKey, confidence: 100 };
    onMappingsChange(updated);
  };

  const handleClearMapping = (targetKey: string) => {
    const idx = targetToIndex.get(targetKey);
    if (idx !== undefined) {
      const updated = [...mappings];
      updated[idx] = { ...updated[idx], targetColumn: '', confidence: 0 };
      onMappingsChange(updated);
    }
  };

  const handleChangeTransformation = (targetKey: string, t: TransformationType) => {
    const idx = targetToIndex.get(targetKey);
    if (idx !== undefined) {
      const updated = [...mappings];
      updated[idx] = { ...updated[idx], transformation: t };
      onMappingsChange(updated);
    }
  };

  const mappedTargets = new Set(mappings.filter(m => m.targetColumn).map(m => m.targetColumn));
  const unmappedRequired = requiredFields.filter(f => !mappedTargets.has(f));
  const unmappedSources = mappings.filter(m => !m.targetColumn);

  // Group standard columns
  const groupedColumns = GROUP_ORDER.map(groupKey => ({
    ...GROUP_META[groupKey],
    key: groupKey,
    columns: STANDARD_COLUMNS.filter(c => c.group === groupKey),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Template banner */}
      {suggestedTemplate && (
        <div className="rounded-lg bg-success/10 border border-success/30 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Configurazione riconosciuta!</p>
            <p className="text-muted-foreground">
              Le colonne di questo file corrispondono al tracciato "<strong>{suggestedTemplate.name}</strong>" già utilizzato in precedenza.
              Il mapping è stato applicato automaticamente.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAutoMap} className="shrink-0">
            <RotateCcw className="h-3 w-3 mr-1" />
            Rimappa
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Mapping colonne</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Associa le colonne del tuo file ai campi della rubrica
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleAutoMap} variant="outline">
            <Wand2 className="h-4 w-4" />
            Auto-mappa
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground/80">
          <p className="font-medium text-foreground mb-1">Come funziona?</p>
          <p>Qui sotto trovi i campi della rubrica, organizzati per categoria. Per ciascuno, scegli quale colonna del tuo file contiene quel dato. Le colonne che non associ verranno semplicemente ignorate.</p>
          <p className="mt-1 text-muted-foreground">Puoi rimuovere un'associazione con il pulsante ✕ sulla card.</p>
        </div>
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
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          Campi obbligatori non mappati: {unmappedRequired.map(f => STANDARD_COLUMNS.find(c => c.key === f)?.label || f).join(', ')}
        </div>
      )}

      {/* Grouped field cards */}
      {groupedColumns.map((group) => (
        <motion.div
          key={group.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>{group.icon}</span>
            {group.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.columns.map((stdCol) => {
              const mappingIdx = targetToIndex.get(stdCol.key);
              const mapping = mappingIdx !== undefined ? mappings[mappingIdx] : undefined;

              return (
                <FieldCard
                  key={stdCol.key}
                  stdCol={stdCol}
                  mapping={mapping}
                  sourceHeaders={parsedFile.headers}
                  sampleRows={parsedFile.sampleRows}
                  onSelectSource={(src) => handleSelectSource(stdCol.key, src)}
                  onClearMapping={() => handleClearMapping(stdCol.key)}
                  onChangeTransformation={(t) => handleChangeTransformation(stdCol.key, t)}
                  isRequired={requiredFields.includes(stdCol.key)}
                />
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Unmapped source columns */}
      {unmappedSources.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-muted-foreground">Colonne del file non associate</h3>
          <p className="text-xs text-muted-foreground">Queste colonne del tuo file non sono state associate a nessun campo e verranno ignorate durante l'import.</p>
          <div className="flex flex-wrap gap-2">
            {unmappedSources.map((m, i) => {
              const examples = parsedFile.sampleRows.slice(0, 2).map(r => r[m.sourceIndex]).filter(v => v?.trim());
              return (
                <div key={i} className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{m.sourceColumn}</span>
                  {examples.length > 0 && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      es: {examples.join(', ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <Button variant="outline" onClick={onBack}>
          ← Indietro
        </Button>
        <div className="flex gap-2">
          {onSaveTemplate && (
            <Button variant="outline" onClick={() => { onSaveTemplate(); setSaved(true); }} disabled={mappings.filter(m => m.targetColumn).length === 0}>
              <Save className="h-4 w-4" />
              {saved ? 'Salvato ✓' : 'Salva configurazione'}
            </Button>
          )}
          <Button
            onClick={() => { onSaveTemplate?.(); onConfirm(); }}
            disabled={mappings.filter(m => m.targetColumn).length === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Valida e Importa →
          </Button>
        </div>
      </div>
    </div>
  );
}
