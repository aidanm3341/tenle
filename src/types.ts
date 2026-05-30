export type OperatorSymbol = '+' | '-' | '×' | '÷' | '^';

export type DragItem =
  | { kind: 'operator'; value: OperatorSymbol }
  | { kind: 'bracket'; value: 'open' | 'close' };

export interface BracketState {
  open: number[];   // count of '(' before each number
  close: number[];  // count of ')' after each number
}

export interface Puzzle {
  id: number;
  numbers: [number, number, number, number, number];
}

export interface GameStats {
  streak: number;
  maxStreak: number;
  totalSolved: number;
  lastSolvedDate: string | null;
}

export interface DailyState {
  date: string;
  operators: (OperatorSymbol | null)[];
  brackets: BracketState;
  isSolved: boolean;
  startedAt: number | null;    // ms timestamp of the first move (when the timer started)
  solveSeconds: number | null; // elapsed seconds at the moment it was solved
}
