/** Shared date formatter for blog cards and post headers. */
export function formatDate(d: Date, month: 'short' | 'long' = 'short'): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric' });
}
