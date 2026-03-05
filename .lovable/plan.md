

## Problema attuale

La pagina di mapping ha diversi problemi di usabilità:

1. **Dropdown disabilitati**: le opzioni già mappate da altre colonne vengono disabilitate (`disabled={mappedTargets.has(col.key) && mapping.targetColumn !== col.key}`), impedendo di selezionarle. L'utente dovrebbe poter riassegnare liberamente (il sistema sposta automaticamente il mapping).
2. **Layout tabellare confuso**: tutte le colonne del file sono presentate alla stessa altezza in una tabella densa con 5 colonne, difficile da capire.
3. **Nessuna organizzazione per categoria**: i campi standard non sono raggruppati (Persona, Indirizzo, Contatti, Altro).
4. **Nessun modo rapido di "non mappare"**: bisogna aprire il dropdown e selezionare "Non mappare".

## Piano di redesign

### 1. Nuovo layout a card per categoria (non più tabella)

Riorganizzare la vista con un approccio **"target-centric"** — ovvero mostrare i campi di destinazione raggruppati per categoria, e per ciascuno l'utente sceglie quale colonna del file associare.

**Categorie** (in ordine):
- **👤 Persona**: Nome, Cognome, Azienda
- **📧 Contatti**: Email, Telefono  
- **📍 Indirizzo**: Via, Civico, Città, Provincia, CAP, Nazione
- **📝 Altro**: Note

Aggiungere un campo `group` in `StandardColumn` e aggiornare `STANDARD_COLUMNS` in `standardSchema.ts`.

### 2. Card per ogni campo destinazione

Ogni campo destinazione è una card che mostra:
- Nome del campo + descrizione
- Dropdown per scegliere la colonna sorgente (tutte selezionabili, nessuna disabilitata — se si riassegna, il vecchio mapping viene rimosso automaticamente)
- Anteprima di 2-3 valori esempio dalla colonna scelta
- Selettore trasformazione (collassato, visibile solo se mappato)
- Badge di confidenza

### 3. Pulsante "Non mappare" con un click

Ogni card mappata mostra un piccolo pulsante ✕ per rimuovere il mapping con un solo click, senza dover entrare nel dropdown.

### 4. Sezione "Colonne non mappate" in fondo

In fondo, mostrare le colonne del file che non sono state associate a nessun campo, con esempi dei valori, così l'utente vede cosa sta ignorando.

### 5. Istruzioni chiare in alto

Aggiungere un box esplicativo in alto: "Qui sotto trovi i campi della rubrica. Per ciascuno, scegli quale colonna del tuo file contiene quel dato. Le colonne che non associ verranno ignorate."

### File da modificare

- **`src/lib/standardSchema.ts`**: aggiungere campo `group` a ogni colonna standard
- **`src/lib/types.ts`**: aggiungere `group` a `StandardColumn`
- **`src/components/import/SchemaMappingStep.tsx`**: riscrivere completamente il componente con il nuovo layout a card raggruppate per categoria

### Dettagli tecnici

- Rimuovere il `disabled` dal dropdown: quando l'utente seleziona una colonna già usata altrove, il vecchio mapping viene automaticamente rimosso (questa logica esiste già in `updateMapping`, basta togliere il `disabled`)
- Invertire la prospettiva: iterare su `STANDARD_COLUMNS` raggruppate, e per ciascuna mostrare un `<select>` con le colonne del file sorgente
- Bottone ✕ chiama `updateMapping(index, 'targetColumn', '')` per smappare con un click
- Sezione finale filtra `mappings.filter(m => !m.targetColumn)` per mostrare le colonne ignorate

