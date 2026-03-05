import { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadStepProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED_TYPES = [
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ACCEPTED_EXTENSIONS = ['.csv', '.txt', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-8 w-8" />;
  return <FileText className="h-8 w-8" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUploadStep({ onFileSelected, isLoading }: FileUploadStepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Formato non supportato. Usa: ${ACCEPTED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File troppo grande (max ${formatSize(MAX_FILE_SIZE)})`;
    }
    if (file.size === 0) {
      return 'Il file è vuoto';
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setError('');
    setSelectedFile(file);
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = () => {
    if (selectedFile) onFileSelected(selectedFile);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Carica il tuo file</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Supporta CSV, TXT, XLS e XLSX — fino a 20 MB
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-accent bg-accent/5 shadow-glow-accent'
            : selectedFile
              ? 'border-success/40 bg-success/5'
              : 'border-border hover:border-accent/50 hover:bg-muted/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="text-success">
                {getFileIcon(selectedFile.name)}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Rimuovi
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Trascina qui il file o <span className="text-accent underline underline-offset-2">sfoglia</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  .csv · .txt · .xls · .xlsx
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Analisi in corso...
              </>
            ) : (
              'Analizza file'
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
