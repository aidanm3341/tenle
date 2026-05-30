import { useEffect, useState } from 'react';
import './ResultDisplay.css';

interface ResultDisplayProps {
  expression: string;
  result: number | null;
  isComplete: boolean;
  isBracketValid: boolean;
  isWon: boolean;
}

function formatResult(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const fixed = parseFloat(n.toFixed(4));
  return String(fixed);
}

export default function ResultDisplay({ expression, result, isComplete, isBracketValid, isWon }: ResultDisplayProps) {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (isWon) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isWon]);

  let valueClass = 'state-idle';
  let displayValue: string = '—';
  let statusText = 'Place all operators';

  if (!isBracketValid) {
    valueClass = 'state-error';
    displayValue = 'Unmatched brackets';
    statusText = '';
  } else if (isComplete && result !== null) {
    const isTarget = Math.abs(result - 10) < 1e-9;
    if (isTarget) {
      valueClass = 'state-correct';
      displayValue = '10';
      statusText = '✓';
    } else {
      valueClass = 'state-wrong';
      displayValue = formatResult(result);
      statusText = `Need ${10 - result > 0 ? '+' : ''}${formatResult(10 - result)} more`;
    }
  } else if (isComplete) {
    valueClass = 'state-pending';
    displayValue = '...';
    statusText = '';
  }

  const cleanExpr = expression.replace(/\?/g, '▢');

  return (
    <div className={`result-display${flashing ? ' flashing' : ''}`} aria-live="polite" aria-atomic="true">
      <div className="result-expression">{cleanExpr}</div>
      <div className={`result-value ${valueClass}`}>{displayValue}</div>
      <div className={`result-status${isWon ? ' correct' : ''}`}>{statusText}</div>
    </div>
  );
}
