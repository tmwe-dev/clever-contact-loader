import { ValidationResult, ParsedFile, ColumnMapping, RejectedRow } from '@/lib/types';
import { validateAndTransform } from '@/lib/validator';
import { exportRejectedToXlsx } from '@/lib/exportUtils';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Download, FileSpreadsheet, AlertTriangle, BarChart3 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';

interface ValidationStepProps {
  parsedFile: ParsedFile;
  mappings: ColumnMapping[];
  requiredFields: string[];
  jobId: string;
  onComplete: (result: ValidationResult) => void;
  onBack: () => void;
  onNewImport: () => void;
}

export default function ValidationStep({
  parsedFile,
  mappings,
  requiredFields,
  jobId,
  onComplete,
  onBack,
  onNewImport,
}: ValidationStepProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'validating' | 'done'>('idle');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const runValidation = useCallback(() => {
    setPhase('validating');
    setProgress(0);

    // Simulate async progress
    const totalSteps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(Math.min((step / totalSteps) * 95, 95));
      if (step >= totalSteps) clearInterval(interval);
    }, 80);

    // Run validation (synchronous but wrapped in timeout for UI)
    setTimeout(() => {
      const validationResult = validateAndTransform(parsedFile.rows, mappings, requiredFields);
      clearInterval(interval);
      setProgress(100);
      setResult(validationResult);
      setPhase('done');
      onComplete(validationResult);
    }, 1800);
  }, [parsedFile, mappings, requiredFields, onComplete]);

  const handleDownloadScarti = () => {
    if (result && result.rejectedRows.length > 0) {
      exportRejectedToXlsx(result.rejectedRows, parsedFile.headers, jobId);
    }
  };

  // Group rejection reasons
  const errorSummary = result
    ? result.rejectedRows.reduce<Record<string, number>>((acc, row) => {
        row.reasons.forEach(r => {
          const key = r.replace(/:.*$/, '');
          acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Validazione & Import</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {phase === 'idle' && 'Pronto per avviare la validazione e l\'import dei dati'}
          {phase === 'validating' && 'Validazione in corso...'}
          {phase === 'done' && 'Processo completato'}
        </p>
      </div>

      {/* Summary pre-import */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Riepilogo configurazione
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Righe totali</span>
                <p className="font-semibold text-foreground">{parsedFile.totalRows.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Colonne mappate</span>
                <p className="font-semibold text-foreground">{mappings.filter(m => m.targetColumn).length} / {mappings.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Campi obbligatori</span>
                <p className="font-semibold text-foreground">{requiredFields.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Formato</span>
                <p className="font-semibold text-foreground">{parsedFile.detectedFormat.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ← Indietro
            </button>
            <button
              onClick={runValidation}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              🚀 Avvia validazione e import
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress */}
      {phase === 'validating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4"
        >
          <div className="h-10 w-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm font-medium text-foreground">Validazione e trasformazione dati in corso...</p>
          <div className="w-full max-w-md">
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </motion.div>
      )}

      {/* Results */}
      {phase === 'done' && result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <p className="text-3xl font-bold text-foreground">{result.stats.totalRows.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Righe totali</p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-5 text-center">
              <p className="text-3xl font-bold text-success">{result.stats.importedCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Importate
              </p>
            </div>
            <div className={`rounded-lg border p-5 text-center ${
              result.stats.rejectedCount > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
            }`}>
              <p className={`text-3xl font-bold ${result.stats.rejectedCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {result.stats.rejectedCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Scartate
              </p>
            </div>
          </div>

          {/* Success rate bar */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tasso di successo</span>
              <span className="font-semibold text-foreground">
                {result.stats.totalRows > 0 ? Math.round((result.stats.importedCount / result.stats.totalRows) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${result.stats.totalRows > 0 ? (result.stats.importedCount / result.stats.totalRows) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Error summary */}
          {Object.keys(errorSummary).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Errori più comuni
              </h3>
              <div className="space-y-2">
                {Object.entries(errorSummary)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([reason, count]) => (
                    <div key={reason} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{reason}</span>
                      <span className="text-muted-foreground font-mono">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Download scarti */}
          {result.rejectedRows.length > 0 && (
            <button
              onClick={handleDownloadScarti}
              className="w-full rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Scarica Scarti.xlsx ({result.rejectedRows.length} righe)
            </button>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={onNewImport}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Nuovo import
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
