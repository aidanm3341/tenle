import type { OperatorSymbol, BracketState } from '../types';

export function buildExpression(
  numbers: number[],
  operators: (OperatorSymbol | null)[],
  brackets: BracketState
): string {
  let expr = '';
  for (let i = 0; i < numbers.length; i++) {
    expr += '('.repeat(brackets.open[i] ?? 0);
    expr += numbers[i];
    expr += ')'.repeat(brackets.close[i] ?? 0);
    if (i < operators.length) {
      const op = operators[i];
      expr += op !== null ? ` ${op} ` : ' ? ';
    }
  }
  return expr;
}

export function validateBrackets(brackets: BracketState): {
  valid: boolean;
  invalidOpen: boolean[];
  invalidClose: boolean[];
} {
  const invalidOpen = Array(5).fill(false);
  const invalidClose = Array(5).fill(false);
  let depth = 0;
  let everNegative = false;

  for (let i = 0; i < 5; i++) {
    depth += brackets.open[i] ?? 0;
    depth -= brackets.close[i] ?? 0;
    if (depth < 0) {
      // More closes than there are opens to match at this point
      invalidClose[i] = true;
      everNegative = true;
      depth = 0;
    }
  }

  // Any leftover depth means unclosed opens — mark the rightmost open positions
  if (depth > 0) {
    let remaining = depth;
    for (let i = 4; i >= 0 && remaining > 0; i--) {
      if ((brackets.open[i] ?? 0) > 0) {
        invalidOpen[i] = true;
        remaining -= brackets.open[i];
      }
    }
  }

  const valid = !everNegative && depth === 0;
  return { valid, invalidOpen, invalidClose };
}

export function evaluate(
  numbers: number[],
  operators: (OperatorSymbol | null)[],
  brackets: BracketState
): number | null {
  if (operators.some((op) => op === null)) return null;

  const { valid } = validateBrackets(brackets);
  if (!valid) return null;

  let expr = '';
  for (let i = 0; i < numbers.length; i++) {
    expr += '('.repeat(brackets.open[i] ?? 0);
    expr += numbers[i];
    expr += ')'.repeat(brackets.close[i] ?? 0);
    if (i < operators.length) {
      const op = operators[i]!;
      const jsOp = op === '×' ? '*' : op === '÷' ? '/' : op === '^' ? '**' : op;
      expr += ` ${jsOp} `;
    }
  }

  try {
    // Safe: expr is built entirely from our controlled number/operator values
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')() as number;
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
