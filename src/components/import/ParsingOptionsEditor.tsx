import { ParsingOptions } from '@/lib/types';
import { motion } from 'framer-motion';

interface ParsingOptionsEditorProps {
  options: ParsingOptions;
  onChange: (options: ParsingOptions) => void;
  onReparse: () => void;
}

export default function ParsingOptionsEditor({ options, onChange, onReparse }: ParsingOptionsEditorProps) {
  const update = (key: keyof ParsingOptions, value: string | boolean | number) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-foreground">Opzioni di parsing</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {!options.sheets && (
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Separatore</span>
            <select
              value={options.delimiter}
              onChange={(e) => update('delimiter', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value=",">Virgola (,)</option>
              <option value=";">Punto e virgola (;)</option>
              <option value={'\t'}>Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </label>
        )}

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Encoding</span>
          <select
            value={options.encoding}
            onChange={(e) => update('encoding', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="utf-8">UTF-8</option>
            <option value="iso-8859-1">Latin-1 (ISO-8859-1)</option>
            <option value="windows-1252">Windows-1252</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Carattere quote</span>
          <select
            value={options.quoteChar}
            onChange={(e) => update('quoteChar', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value='"'>Doppi apici (")</option>
            <option value="'">Apice singolo (')</option>
            <option value="">Nessuno</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Righe da saltare</span>
          <input
            type="number"
            min={0}
            max={100}
            value={options.skipRows}
            onChange={(e) => update('skipRows', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-1">
          <input
            type="checkbox"
            checked={options.hasHeader}
            onChange={(e) => update('hasHeader', e.target.checked)}
            className="rounded border-input h-4 w-4 accent-accent"
          />
          <span className="text-sm text-foreground">Prima riga = intestazione</span>
        </label>

        {options.sheets && options.sheets.length > 1 && (
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Foglio</span>
            <select
              value={options.selectedSheet}
              onChange={(e) => update('selectedSheet', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {options.sheets.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onReparse}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Rianalizza file ↻
        </button>
      </div>
    </motion.div>
  );
}
