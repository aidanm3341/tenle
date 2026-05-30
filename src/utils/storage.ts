import type { DailyState, GameStats } from '../types';

const DAILY_KEY = 'tenner-daily';
const STATS_KEY = 'tenner-stats';

export function loadDailyState(): DailyState | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? (JSON.parse(raw) as DailyState) : null;
  } catch {
    return null;
  }
}

export function saveDailyState(state: DailyState): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify(state));
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw
      ? (JSON.parse(raw) as GameStats)
      : { streak: 0, maxStreak: 0, totalSolved: 0, lastSolvedDate: null };
  } catch {
    return { streak: 0, maxStreak: 0, totalSolved: 0, lastSolvedDate: null };
  }
}

export function saveStats(stats: GameStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
