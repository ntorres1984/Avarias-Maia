import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd/MM/yyyy', { locale: pt });
  } catch {
    return value;
  }
}
