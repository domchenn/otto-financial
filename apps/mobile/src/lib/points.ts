/** Points balances (PRD F3): what the user confirmed plus Otto's estimate since then. */

export type ProgramCard = {
  account_id: string;
  card_name: string;
  account_mask: string | null;
};

export type PointsProgram = {
  id: string;
  name: string;
  short_name: string;
  cards: ProgramCard[];
  confirmed_points: number | null;
  confirmed_at: string | null;
  earned_since: number;
  estimated_points: number | null;
};

export type Points = {
  total_points: number;
  confirmed_count: number;
  programs: PointsProgram[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Confirmed today", "Confirmed 3 days ago", or the date once it's over a month old. */
export function confirmedLabel(iso: string, now = new Date()): string {
  const at = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'Confirmed today';
  if (days === 1) return 'Confirmed yesterday';
  if (days <= 30) return `Confirmed ${days} days ago`;
  return `Confirmed ${shortDate.format(at)}`;
}

/** The cards that earn into a program, e.g. "Sapphire Preferred, Freedom Unlimited". */
export function cardNames(p: PointsProgram): string {
  return p.cards.map((c) => c.card_name).join(', ');
}

/** Home tile caption: what to do next, or that the number is an estimate. */
export function pointsCaption(points: Points): string {
  const missing = points.programs.length - points.confirmed_count;
  if (points.programs.length === 0) return 'No points cards yet';
  if (points.confirmed_count === 0) return 'Add your balance';
  if (missing > 0) return `Add ${missing} more balance${missing === 1 ? '' : 's'}`;
  return 'Estimated';
}

/** A typed balance ("120,500") as whole points, or null if it isn't a number. */
export function parsePoints(text: string): number | null {
  const digits = text.replace(/[\s,]/g, '');
  if (!/^\d{1,9}$/.test(digits)) return null;
  return Number(digits);
}

export function findProgram(points: Points | undefined, id: string): PointsProgram | undefined {
  return points?.programs.find((p) => p.id === id);
}
