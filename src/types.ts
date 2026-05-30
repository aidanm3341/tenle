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
}
