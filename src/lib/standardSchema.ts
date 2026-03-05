import { StandardColumn } from './types';

export const STANDARD_COLUMNS: StandardColumn[] = [
  { key: 'first_name', label: 'Nome', required: false, type: 'string', description: 'Nome di battesimo', group: 'persona' },
  { key: 'last_name', label: 'Cognome', required: false, type: 'string', description: 'Cognome', group: 'persona' },
  { key: 'company', label: 'Azienda', required: false, type: 'string', description: 'Ragione sociale', group: 'persona' },
  { key: 'email', label: 'Email', required: false, type: 'email', description: 'Indirizzo email', group: 'contatti' },
  { key: 'phone', label: 'Telefono', required: false, type: 'phone', description: 'Numero di telefono', group: 'contatti' },
  { key: 'street', label: 'Indirizzo', required: false, type: 'string', description: 'Via/Piazza e nome', group: 'indirizzo' },
  { key: 'street_number', label: 'Civico', required: false, type: 'string', description: 'Numero civico', group: 'indirizzo' },
  { key: 'city', label: 'Città', required: false, type: 'string', description: 'Comune', group: 'indirizzo' },
  { key: 'province', label: 'Provincia', required: false, type: 'string', description: 'Sigla provincia (es. MI)', group: 'indirizzo' },
  { key: 'postal_code', label: 'CAP', required: false, type: 'string', description: 'Codice Avviamento Postale', group: 'indirizzo' },
  { key: 'country', label: 'Nazione', required: false, type: 'string', description: 'Codice ISO2 nazione', group: 'indirizzo' },
  { key: 'notes', label: 'Note', required: false, type: 'string', description: 'Note aggiuntive', group: 'altro' },
];

export const REQUIRED_FIELDS_PRESETS: Record<string, string[]> = {
  'Email obbligatoria': ['email'],
  'Telefono obbligatorio': ['phone'],
  'Email o Telefono': ['email', 'phone'],
  'Indirizzo completo': ['street', 'city', 'postal_code'],
  'Nome completo + Email': ['first_name', 'last_name', 'email'],
};

export const GROUP_META: Record<string, { label: string; icon: string }> = {
  persona: { label: 'Persona', icon: '👤' },
  contatti: { label: 'Contatti', icon: '📧' },
  indirizzo: { label: 'Indirizzo', icon: '📍' },
  altro: { label: 'Altro', icon: '📝' },
};

export const GROUP_ORDER = ['persona', 'contatti', 'indirizzo', 'altro'] as const;
