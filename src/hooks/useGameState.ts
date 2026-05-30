import { useState, useEffect, useCallback } from 'react';
import type { OperatorSymbol, BracketState, GameStats, Puzzle } from '../types';
import { evaluate, buildExpression, validateBrackets } from '../utils/evaluator';
import { getDateString, getYesterdayString, getPuzzleByNumber, getPuzzleNumber, normalizeRoute } from '../utils/puzzleUtils';
import { loadDailyState, saveDailyState, loadStats, saveStats } from '../utils/storage';

const EMPTY_BRACKETS: BracketState = {
  open: [0, 0, 0, 0, 0],
  close: [0, 0, 0, 0, 0],
};

// Coerce a possibly-legacy bracket state (old boolean[] format) into counts
function normalizeBrackets(b: BracketState | undefined): BracketState {
  if (!b) return EMPTY_BRACKETS;
  const toCounts = (arr: (number | boolean)[]) =>
    Array.from({ length: 5 }, (_, i) => Number(arr?.[i] ?? 0));
  return { open: toCounts(b.open), close: toCounts(b.close) };
}

export function useGameState() {
  const today = getDateString();
  const todayNumber = getPuzzleNumber(today);

  // Resolve which puzzle to show from the URL path (base-aware for GH Pages).
  // root → today; "{n}" with 1 ≤ n ≤ today → that archived puzzle;
  // anything else (future number, garbage path) → redirect to today.
  const base = import.meta.env.BASE_URL;
  const route = normalizeRoute(window.location.pathname, base);
  const isRoot = route === '';
  const requested = /^\d+$/.test(route) ? parseInt(route, 10) : null;
  let puzzleNumber = todayNumber;
  let isArchive = false;
  let needsRedirect = false;
  if (!isRoot) {
    if (requested !== null && requested >= 1 && requested <= todayNumber) {
      puzzleNumber = requested;
      isArchive = requested !== todayNumber;
    } else {
      needsRedirect = true; // future / out-of-range / non-numeric → today
    }
  }
  const puzzle = getPuzzleByNumber(puzzleNumber);

  // Clean up an invalid/future URL back to the root
  useEffect(() => {
    if (needsRedirect) window.history.replaceState(null, '', base);
  }, [needsRedirect, base]);

  const [operators, setOperators] = useState<(OperatorSymbol | null)[]>([null, null, null, null]);
  const [brackets, setBrackets] = useState<BracketState>(EMPTY_BRACKETS);
  const [isSolved, setIsSolved] = useState(false);
  const [stats, setStats] = useState<GameStats>(loadStats());
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Restore today's daily state on mount (archived puzzles always start fresh)
  useEffect(() => {
    if (isArchive) return;
    const saved = loadDailyState();
    if (saved && saved.date === today) {
      setOperators(saved.operators);
      setBrackets(normalizeBrackets(saved.brackets));
      setIsSolved(saved.isSolved);
      if (saved.isSolved) setIsWinModalOpen(true);
    }
  }, [today, isArchive]);

  // Derived values
  const expression = buildExpression(puzzle.numbers, operators, brackets);
  const isComplete = operators.every((op) => op !== null);
  const { valid: isBracketValid, invalidOpen, invalidClose } = validateBrackets(brackets);
  const result = evaluate(puzzle.numbers, operators, brackets);

  const persistDaily = useCallback(
    (ops: (OperatorSymbol | null)[], brk: BracketState, solved: boolean) => {
      if (isArchive) return; // archived puzzles never overwrite today's progress
      saveDailyState({ date: today, operators: ops, brackets: brk, isSolved: solved });
    },
    [today, isArchive]
  );

  const handleWin = useCallback(
    (ops: (OperatorSymbol | null)[], brk: BracketState) => {
      // Only the daily puzzle affects streaks and persisted progress
      if (!isArchive) {
        const yesterday = getYesterdayString();
        const newStats = loadStats();
        const isConsecutive = newStats.lastSolvedDate === yesterday || newStats.lastSolvedDate === today;
        const newStreak = isConsecutive ? newStats.streak + 1 : 1;
        const updated: GameStats = {
          streak: newStreak,
          maxStreak: Math.max(newStats.maxStreak, newStreak),
          totalSolved: newStats.totalSolved + 1,
          lastSolvedDate: today,
        };
        saveStats(updated);
        setStats(updated);
        persistDaily(ops, brk, true);
      }
      setIsSolved(true);
      setTimeout(() => setIsWinModalOpen(true), 600);
    },
    [today, persistDaily, isArchive]
  );

  const checkWin = useCallback(
    (ops: (OperatorSymbol | null)[], brk: BracketState) => {
      const res = evaluate(puzzle.numbers, ops, brk);
      const allFilled = ops.every((o) => o !== null);
      if (allFilled && res !== null && Math.abs(res - 10) < 1e-9) {
        handleWin(ops, brk);
        return true;
      }
      return false;
    },
    [puzzle.numbers, handleWin]
  );

  // Place an operator into a specific slot (called on drop)
  const setOperator = useCallback(
    (op: OperatorSymbol, slotIndex: number) => {
      const newOps = [...operators] as (OperatorSymbol | null)[];
      newOps[slotIndex] = op;
      setOperators(newOps);
      if (!checkWin(newOps, brackets)) {
        persistDaily(newOps, brackets, false);
      }
    },
    [operators, brackets, checkWin, persistDaily]
  );

  // Clear a specific operator slot (called on tap)
  const clearOperator = useCallback(
    (slotIndex: number) => {
      const newOps = [...operators] as (OperatorSymbol | null)[];
      newOps[slotIndex] = null;
      setOperators(newOps);
      persistDaily(newOps, brackets, false);
    },
    [operators, brackets, persistDaily]
  );

  // Place a bracket (called on drop — adds one)
  const placeBracket = useCallback(
    (position: number, type: 'open' | 'close') => {
      const newBrackets: BracketState = {
        open: [...brackets.open],
        close: [...brackets.close],
      };
      if (type === 'open') newBrackets.open[position] += 1;
      else newBrackets.close[position] += 1;
      setBrackets(newBrackets);
      if (!checkWin(operators, newBrackets)) {
        persistDaily(operators, newBrackets, false);
      }
    },
    [brackets, operators, checkWin, persistDaily]
  );

  // Remove a bracket (called on tap — removes one, floors at 0)
  const removeBracket = useCallback(
    (position: number, type: 'open' | 'close') => {
      const newBrackets: BracketState = {
        open: [...brackets.open],
        close: [...brackets.close],
      };
      if (type === 'open') newBrackets.open[position] = Math.max(0, newBrackets.open[position] - 1);
      else newBrackets.close[position] = Math.max(0, newBrackets.close[position] - 1);
      setBrackets(newBrackets);
      if (!checkWin(operators, newBrackets)) {
        persistDaily(operators, newBrackets, false);
      }
    },
    [brackets, operators, checkWin, persistDaily]
  );

  const getShareText = useCallback(() => {
    const EMOJI: Record<string, string> = { '+': '🟥', '-': '🟦', '×': '🟧', '÷': '🟨', '^': '🟪' };
    const opRow = operators.map((op) => (op ? EMOJI[op] : '⬜')).join('');
    const bracketRow = Array(5)
      .fill(0)
      .map((_, i) => (brackets.open[i] > 0 || brackets.close[i] > 0 ? '🟤' : '⬜'))
      .join('');
    return [
      `TENLE #${puzzleNumber} ✅`,
      '',
      `${expression} = 10`,
      '',
      opRow,
      bracketRow,
    ].join('\n');
  }, [operators, brackets, expression, puzzleNumber]);

  return {
    puzzle: puzzle as Puzzle,
    puzzleNumber,
    isArchive,
    operators,
    brackets,
    expression,
    result,
    isComplete,
    isBracketValid,
    invalidBracketPositions: { open: invalidOpen, close: invalidClose },
    isSolved,
    stats,
    isWinModalOpen,
    isHelpModalOpen,
    setOperator,
    clearOperator,
    placeBracket,
    removeBracket,
    openHelpModal: () => setIsHelpModalOpen(true),
    closeHelpModal: () => setIsHelpModalOpen(false),
    closeWinModal: () => setIsWinModalOpen(false),
    getShareText,
  };
}
