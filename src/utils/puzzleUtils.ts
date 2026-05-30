import type { Puzzle } from '../types';
import puzzles from '../data/puzzles.json';

const EPOCH = '2026-05-01';
const EPOCH_MS = new Date(EPOCH).getTime();

export function getDateString(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getPuzzleNumber(dateStr: string): number {
  const todayMs = new Date(dateStr).getTime();
  return Math.floor((todayMs - EPOCH_MS) / 86_400_000) + 1;
}

// Look up a puzzle by its 1-based number (wraps around the list if it ever exceeds its length)
export function getPuzzleByNumber(n: number): Puzzle {
  const list = puzzles as Puzzle[];
  const index = (((n - 1) % list.length) + list.length) % list.length;
  return list[index];
}

// Strip the app's base prefix (e.g. "/make10/") off a pathname and return the
// bare route segment — "" for the root, or "5" / "abc" for sub-paths.
export function normalizeRoute(pathname: string, base: string): string {
  let rel = pathname;
  if (base && base !== '/') {
    if (rel.startsWith(base)) rel = rel.slice(base.length);
    else if (rel === base.replace(/\/+$/, '')) rel = '';
  }
  return rel.replace(/^\/+/, '').replace(/\/+$/, '');
}
