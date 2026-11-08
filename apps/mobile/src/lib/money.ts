const wholeDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const withCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat('en-US');

/**
 * Format integer cents as dollars. `cents: 'auto'` shows cents only when they aren't zero.
 * Whole dollars truncate toward zero so "$312 left" never overstates what's left.
 */
export function formatCents(
  cents: number,
  options: { cents?: boolean | 'auto'; sign?: boolean } = {},
): string {
  const value = Math.trunc(cents);
  const showCents = options.cents === true || (options.cents === 'auto' && value % 100 !== 0);
  const abs = Math.abs(value);
  const body = showCents ? withCents.format(abs / 100) : wholeDollars.format(Math.trunc(abs / 100));
  const sign = value < 0 ? '−' : options.sign && value > 0 ? '+' : '';
  return sign + body;
}

export function formatNumber(n: number): string {
  return plain.format(n);
}

/** 142800 → "142k". */
export function formatCompact(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}
