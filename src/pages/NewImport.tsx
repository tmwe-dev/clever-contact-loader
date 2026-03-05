import { useState, useCallback } from 'react';
import { parseFile } from '@/lib/fileParser';
import { autoMapColumns } from '@/lib/heuristicMapper';
import { findMatchingTemplate, applyTemplate, saveMappingTemplate, useTemplate, MappingTemplate } from '@/lib/mappingTemplates';
import { ParsedFile, ParsingOptions, ColumnMapping, ValidationResult } from '@/lib/types';
import ImportStepper from '@/components/import/ImportStepper';
import FileUploadStep from '@/components/import/FileUploadStep';
import DataPreviewStep from '@/components/import/DataPreviewStep';
import SchemaMappingStep from '@/components/import/SchemaMappingStep';
import ValidationStep from '@/components/import/ValidationStep';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Upload', description: 'Carica il file' },
  { label: 'Anteprima', description: 'Verifica i dati' },
  { label: 'Mapping', description: 'Associa colonne' },
  { label: 'Import', description: 'Valida e importa' },
];

interface ImportJobLocal {
  id: string;
  filename: string;
  file: File;
  parsedFile: ParsedFile | null;
  parsingOptions: ParsingOptions | null;
  mappings: ColumnMapping[];
  requiredFields: string[];
  result: ValidationResult | null;
  suggestedTemplate: MappingTemplate | null;
}

export default function NewImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<ImportJobLocal | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const { parsed, options } = await parseFile(file);

      // Check for a saved template matching these headers
      const template = findMatchingTemplate(parsed.headers);
      let mappings: ColumnMapping[];
      let requiredFields: string[] = [];

      if (template) {
        mappings = applyTemplate(template, parsed.headers);
        requiredFields = [...template.requiredFields];
      } else {
        mappings = autoMapColumns(parsed.headers, parsed.sampleRows);
      }

      setJob({
        id: Math.random().toString(36).slice(2, 10),
        filename: file.name,
        file,
        parsedFile: parsed,
        parsingOptions: options,
        mappings,
        requiredFields,
        result: null,
        suggestedTemplate: template,
      });
      setStep(1);
    } catch (err: any) {
      alert('Errore nel parsing: ' + (err?.message || 'Errore sconosciuto'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleReparse = useCallback(async () => {
    if (!job) return;
    setIsLoading(true);
    try {
      const { parsed, options } = await parseFile(job.file, job.parsingOptions || undefined);
      const template = findMatchingTemplate(parsed.headers);
      let mappings: ColumnMapping[];
      let requiredFields = job.requiredFields;
      if (template) {
        mappings = applyTemplate(template, parsed.headers);
        requiredFields = [...template.requiredFields];
      } else {
        mappings = autoMapColumns(parsed.headers, parsed.sampleRows);
      }
      setJob(prev => prev ? { ...prev, parsedFile: parsed, parsingOptions: options, mappings, requiredFields, suggestedTemplate: template } : null);
    } catch (err: any) {
      alert('Errore nel re-parsing: ' + (err?.message || 'Errore sconosciuto'));
    } finally {
      setIsLoading(false);
    }
  }, [job]);

  const handleSaveTemplate = useCallback(() => {
    if (!job?.parsedFile) return;
    const name = job.filename.replace(/\.[^.]+$/, '');
    saveMappingTemplate(name, job.parsedFile.headers, job.mappings, job.requiredFields);
    if (job.suggestedTemplate) useTemplate(job.suggestedTemplate.id);
  }, [job]);

  const handleNewImport = () => {
    setJob(null);
    setStep(0);
  };

  // Save completed jobs to localStorage for history
  const handleComplete = (result: ValidationResult) => {
    if (!job) return;
    setJob(prev => prev ? { ...prev, result } : null);

    // Save to history
    const history = JSON.parse(localStorage.getItem('import_history') || '[]');
    history.unshift({
      id: job.id,
      filename: job.filename,
      createdAt: new Date().toISOString(),
      format: job.parsedFile?.detectedFormat || '',
      stats: result.stats,
      mappingCount: job.mappings.filter(m => m.targetColumn).length,
    });
    localStorage.setItem('import_history', JSON.stringify(history.slice(0, 50)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IU</span>
            </div>
            <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
              Import Universale
            </span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <ImportStepper currentStep={step} steps={STEPS} />

        <div className="mt-8 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="upload" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <FileUploadStep onFileSelected={handleFileSelected} isLoading={isLoading} />
              </motion.div>
            )}

            {step === 1 && job?.parsedFile && job.parsingOptions && (
              <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DataPreviewStep
                  parsedFile={job.parsedFile}
                  parsingOptions={job.parsingOptions}
                  onOptionsChange={(opts) => setJob(prev => prev ? { ...prev, parsingOptions: opts } : null)}
                  onReparse={handleReparse}
                  onConfirm={() => setStep(2)}
                  onBack={() => setStep(0)}
                />
              </motion.div>
            )}

            {step === 2 && job?.parsedFile && (
              <motion.div key="mapping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SchemaMappingStep
                  parsedFile={job.parsedFile}
                  mappings={job.mappings}
                  onMappingsChange={(m) => setJob(prev => prev ? { ...prev, mappings: m } : null)}
                  requiredFields={job.requiredFields}
                  onRequiredFieldsChange={(f) => setJob(prev => prev ? { ...prev, requiredFields: f } : null)}
                  onConfirm={() => setStep(3)}
                  onBack={() => setStep(1)}
                  suggestedTemplate={job.suggestedTemplate}
                  onSaveTemplate={handleSaveTemplate}
                />
              </motion.div>
            )}

            {step === 3 && job?.parsedFile && (
              <motion.div key="validation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ValidationStep
                  parsedFile={job.parsedFile}
                  mappings={job.mappings}
                  requiredFields={job.requiredFields}
                  jobId={job.id}
                  onComplete={handleComplete}
                  onBack={() => setStep(2)}
                  onNewImport={handleNewImport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
