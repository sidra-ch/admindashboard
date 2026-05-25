export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
