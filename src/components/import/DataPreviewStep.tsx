import { ParsedFile, ParsingOptions } from '@/lib/types';
import { motion } from 'framer-motion';
import ParsingOptionsEditor from './ParsingOptionsEditor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataPreviewStepProps {
  parsedFile: ParsedFile;
  parsingOptions: ParsingOptions;
  onOptionsChange: (opts: ParsingOptions) => void;
  onReparse: () => void;
  onConfirm: () => void;
  onBack: () => void;
}

export default function DataPreviewStep({
  parsedFile,
  parsingOptions,
  onOptionsChange,
  onReparse,
  onConfirm,
  onBack,
}: DataPreviewStepProps) {
  const previewRows = parsedFile.rows.slice(0, 20);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Anteprima dati</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {parsedFile.totalRows.toLocaleString()} righe rilevate · {parsedFile.headers.length} colonne · Formato: {parsedFile.detectedFormat.toUpperCase()}
        </p>
      </div>

      <ParsingOptionsEditor
        options={parsingOptions}
        onChange={onOptionsChange}
        onReparse={onReparse}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-border overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-12 text-center font-mono text-xs">#</TableHead>
                {parsedFile.headers.map((h, i) => (
                  <TableHead key={i} className="text-xs font-semibold min-w-[120px]">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, ri) => (
                <TableRow key={ri} className="hover:bg-muted/30">
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {ri + 1}
                  </TableCell>
                  {row.map((cell, ci) => (
                    <TableCell key={ci} className="text-sm max-w-[200px] truncate" title={cell}>
                      {cell || <span className="text-muted-foreground/40 italic">vuoto</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {parsedFile.totalRows > 20 && (
          <div className="text-center py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">
            Mostrando 20 di {parsedFile.totalRows.toLocaleString()} righe
          </div>
        )}
      </motion.div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          ← Indietro
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          Configura mapping →
        </button>
      </div>
    </div>
  );
}
