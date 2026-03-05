import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileSpreadsheet, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface HistoryEntry {
  id: string;
  filename: string;
  createdAt: string;
  format: string;
  stats: { totalRows: number; importedCount: number; rejectedCount: number };
  mappingCount: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('import_history') || '[]');
    setHistory(data);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IU</span>
            </div>
            <span className="font-semibold text-foreground">Import Universale</span>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Importa contatti da qualunque file
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Carica CSV, Excel o file di testo. Mapping automatico, validazione intelligente e export degli scarti in un click.
          </p>
          <button
            onClick={() => navigate('/nuovo-import')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shadow-glow-accent"
          >
            <Plus className="h-4 w-4" />
            Nuovo Import
          </button>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: FileSpreadsheet, title: 'Multi-formato', desc: 'CSV, TXT, XLS, XLSX con auto-detect' },
            { icon: ArrowRight, title: 'Auto-mapping', desc: 'Riconoscimento colonne con sinonimi IT' },
            { icon: CheckCircle2, title: 'Validazione', desc: 'Controlli email, telefono, CAP e altro' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <f.icon className="h-5 w-5 text-accent mb-3" />
              <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Storico Import
          </h2>

          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
              <p className="text-sm text-muted-foreground">Nessun import eseguito</p>
              <p className="text-xs text-muted-foreground mt-1">Inizia caricando il tuo primo file</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString('it-IT')} · {entry.format.toUpperCase()} · {entry.mappingCount} colonne mappate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {entry.stats.importedCount}
                    </span>
                    {entry.stats.rejectedCount > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        {entry.stats.rejectedCount}
                      </span>
                    )}
                    <span className="text-muted-foreground">/ {entry.stats.totalRows}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
