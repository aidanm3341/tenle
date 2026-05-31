import { useState, useEffect, useCallback } from 'react';
import type { OperatorSymbol, BracketState, GameStats, Puzzle } from '../types';
import { evaluate, buildExpression, validateBrackets } from '../utils/evaluator';
import { getDateString, getYesterdayString, getPuzzleByNumber, getPuzzleNumber, normalizeRoute } from '../utils/puzzleUtils';
import { loadDailyState, saveDailyState, loadStats, saveStats } from '../utils/storage';
import { formatDuration } from '../utils/time';

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

  // Timer: starts on the first move, freezes on solve
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [solveSeconds, setSolveSeconds] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // On mount: restore saved progress and start the clock immediately, so the
  // timer counts thinking time from the moment the puzzle loads. startedAt is
  // persisted, so a refresh resumes the clock rather than resetting it.
  useEffect(() => {
    if (isArchive) {
      // Archived puzzles are ephemeral — run an in-memory clock for this session
      setStartedAt(Date.now());
      return;
    }
    const saved = loadDailyState();
    let ops: (OperatorSymbol | null)[] = [null, null, null, null];
    let brk: BracketState = EMPTY_BRACKETS;
    let solved = false;
    let start: number | null = null;
    let solveSecs: number | null = null;
    if (saved && saved.date === today) {
      ops = saved.operators;
      brk = normalizeBrackets(saved.brackets);
      solved = saved.isSolved;
      start = saved.startedAt ?? null;
      solveSecs = saved.solveSeconds ?? null;
      setOperators(ops);
      setBrackets(brk);
      setIsSolved(solved);
      setSolveSeconds(solveSecs);
      if (solved) setIsWinModalOpen(true);
    }
    if (!solved && start == null) {
      // First time opening this puzzle today — stamp and persist the start time
      start = Date.now();
      saveDailyState({ date: today, operators: ops, brackets: brk, isSolved: false, startedAt: start, solveSeconds: null });
    }
    setStartedAt(start);
  }, [today, isArchive]);

  // Tick once a second while the puzzle is started but not yet solved
  useEffect(() => {
    if (isSolved || startedAt === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isSolved, startedAt]);

  // Derived values
  const expression = buildExpression(puzzle.numbers, operators, brackets);
  const isComplete = operators.every((op) => op !== null);
  const { valid: isBracketValid, invalidOpen, invalidClose } = validateBrackets(brackets);
  const result = evaluate(puzzle.numbers, operators, brackets);
  const elapsedSeconds =
    solveSeconds != null
      ? solveSeconds
      : startedAt != null
        ? Math.max(0, Math.floor((now - startedAt) / 1000))
        : 0;

  // Persist current daily progress (no-op for archived puzzles). Pass only the
  // fields that changed; the rest fall back to current state.
  const persist = useCallback(
    (next: {
      operators?: (OperatorSymbol | null)[];
      brackets?: BracketState;
      isSolved?: boolean;
      startedAt?: number | null;
      solveSeconds?: number | null;
    }) => {
      if (isArchive) return;
      saveDailyState({
        date: today,
        operators: next.operators ?? operators,
        brackets: next.brackets ?? brackets,
        isSolved: next.isSolved ?? isSolved,
        startedAt: next.startedAt !== undefined ? next.startedAt : startedAt,
        solveSeconds: next.solveSeconds !== undefined ? next.solveSeconds : solveSeconds,
      });
    },
    [today, isArchive, operators, brackets, isSolved, startedAt, solveSeconds]
  );

  const finishWin = useCallback(
    (ops: (OperatorSymbol | null)[], brk: BracketState, start: number | null) => {
      const secs = start != null ? Math.max(0, Math.floor((Date.now() - start) / 1000)) : 0;
      setSolveSeconds(secs);
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
        persist({ operators: ops, brackets: brk, isSolved: true, startedAt: start, solveSeconds: secs });
      }
      setIsSolved(true);
      setTimeout(() => setIsWinModalOpen(true), 600);
    },
    [today, persist, isArchive]
  );

  const checkWin = useCallback(
    (ops: (OperatorSymbol | null)[], brk: BracketState, start: number | null) => {
      const res = evaluate(puzzle.numbers, ops, brk);
      const allFilled = ops.every((o) => o !== null);
      if (allFilled && res !== null && Math.abs(res - 10) < 1e-9) {
        finishWin(ops, brk, start);
        return true;
      }
      return false;
    },
    [puzzle.numbers, finishWin]
  );

  // Place an operator into a specific slot (called on drop)
  const setOperator = useCallback(
    (op: OperatorSymbol, slotIndex: number) => {
      const newOps = [...operators] as (OperatorSymbol | null)[];
      newOps[slotIndex] = op;
      setOperators(newOps);
      if (!checkWin(newOps, brackets, startedAt)) {
        persist({ operators: newOps });
      }
    },
    [operators, brackets, startedAt, checkWin, persist]
  );

  // Clear a specific operator slot (called on tap)
  const clearOperator = useCallback(
    (slotIndex: number) => {
      const newOps = [...operators] as (OperatorSymbol | null)[];
      newOps[slotIndex] = null;
      setOperators(newOps);
      persist({ operators: newOps });
    },
    [operators, persist]
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
      if (!checkWin(operators, newBrackets, startedAt)) {
        persist({ brackets: newBrackets });
      }
    },
    [brackets, operators, startedAt, checkWin, persist]
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
      if (!checkWin(operators, newBrackets, startedAt)) {
        persist({ brackets: newBrackets });
      }
    },
    [brackets, operators, startedAt, checkWin, persist]
  );

  // Spoiler-free share: puzzle number + solve time + a link to play
  const getShareText = useCallback(() => {
    const playUrl = window.location.origin + import.meta.env.BASE_URL;
    const timeLine = solveSeconds != null ? `⏱ Solved in ${formatDuration(solveSeconds)}` : '⏱ Solved';
    return [`TENLE #${puzzleNumber} ✅`, timeLine, '', playUrl].join('\n');
  }, [puzzleNumber, solveSeconds]);

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
    elapsedSeconds,
    solveSeconds,
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
