import { StandardColumn } from './types';

export const STANDARD_COLUMNS: StandardColumn[] = [
  { key: 'first_name', label: 'Nome', required: false, type: 'string', description: 'Nome di battesimo' },
  { key: 'last_name', label: 'Cognome', required: false, type: 'string', description: 'Cognome' },
  { key: 'company', label: 'Azienda', required: false, type: 'string', description: 'Ragione sociale' },
  { key: 'email', label: 'Email', required: false, type: 'email', description: 'Indirizzo email' },
  { key: 'phone', label: 'Telefono', required: false, type: 'phone', description: 'Numero di telefono' },
  { key: 'street', label: 'Indirizzo', required: false, type: 'string', description: 'Via/Piazza e nome' },
  { key: 'street_number', label: 'Civico', required: false, type: 'string', description: 'Numero civico' },
  { key: 'city', label: 'Città', required: false, type: 'string', description: 'Comune' },
  { key: 'province', label: 'Provincia', required: false, type: 'string', description: 'Sigla provincia (es. MI)' },
  { key: 'postal_code', label: 'CAP', required: false, type: 'string', description: 'Codice Avviamento Postale' },
  { key: 'country', label: 'Nazione', required: false, type: 'string', description: 'Codice ISO2 nazione' },
  { key: 'notes', label: 'Note', required: false, type: 'string', description: 'Note aggiuntive' },
];

export const REQUIRED_FIELDS_PRESETS: Record<string, string[]> = {
  'Email obbligatoria': ['email'],
  'Telefono obbligatorio': ['phone'],
  'Email o Telefono': ['email', 'phone'],
  'Indirizzo completo': ['street', 'city', 'postal_code'],
  'Nome completo + Email': ['first_name', 'last_name', 'email'],
};
