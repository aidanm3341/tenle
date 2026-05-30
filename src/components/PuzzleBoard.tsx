import { useRef, useState, useLayoutEffect } from 'react';
import './PuzzleBoard.css';
import type { DragItem } from '../types';
import NumberTile from './NumberTile';
import OperatorSlot from './OperatorSlot';
import DragPalette from './DragPalette';

interface PuzzleBoardProps {
  numbers: number[];
  operators: (string | null)[];
  brackets: { open: number[]; close: number[] };
  dragging: DragItem | null;
  activeDropZone: string | null;
  isWon: boolean;
  result: number | null;
  isComplete: boolean;
  isBracketValid: boolean;
  startDrag: (item: DragItem, e: React.PointerEvent) => void;
  onClearSlot: (index: number) => void;
  onClearBracket: (position: number, type: 'open' | 'close') => void;
}

function formatResult(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // 2 dp max, strip trailing zeros
  return parseFloat(n.toFixed(2)).toString();
}

export default function PuzzleBoard({
  numbers,
  operators,
  brackets,
  dragging,
  activeDropZone,
  isWon,
  result,
  isComplete,
  isBracketValid,
  startDrag,
  onClearSlot,
  onClearBracket,
}: PuzzleBoardProps) {
  const isDraggingOpenBracket = dragging?.kind === 'bracket' && dragging.value === 'open';
  const isDraggingCloseBracket = dragging?.kind === 'bracket' && dragging.value === 'close';

  // Auto-shrink the expression to fit the card width.
  // offsetWidth is unaffected by CSS transforms, so measuring it after a
  // scale is applied does not create a feedback loop.
  const rowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      const inner = innerRef.current;
      if (!row || !inner) return;
      const available = row.clientWidth;
      const natural = inner.offsetWidth;
      if (available > 0 && natural > 0) {
        setFitScale(Math.min(1, available / natural));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [operators, brackets, numbers]);

  // Derive what to show after the = sign
  let equalsValue = '10';
  let equalsState: 'goal' | 'correct' | 'wrong' | 'invalid' = 'goal';

  if (!isBracketValid) {
    equalsValue = '?';
    equalsState = 'invalid';
  } else if (isComplete && result !== null) {
    equalsValue = formatResult(result);
    equalsState = Math.abs(result - 10) < 1e-9 ? 'correct' : 'wrong';
  }

  return (
    <div className="puzzle-board">
      <div className="puzzle-expression-area">
        <div className="puzzle-row" ref={rowRef}>
          <div
            className="puzzle-row-inner"
            ref={innerRef}
            style={{ transform: `scale(${fitScale})` }}
          >
          {numbers.map((n, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <NumberTile
                value={n}
                index={i}
                isWon={isWon}
                bracketOpenCount={brackets.open[i]}
                bracketCloseCount={brackets.close[i]}
                isDragOverOpen={activeDropZone === `open-${i}`}
                isDragOverClose={activeDropZone === `close-${i}`}
                showOpenZone={isDraggingOpenBracket}
                showCloseZone={isDraggingCloseBracket}
                onClearOpen={() => onClearBracket(i, 'open')}
                onClearClose={() => onClearBracket(i, 'close')}
              />
              {i < numbers.length - 1 && (
                <OperatorSlot
                  value={operators[i]}
                  index={i}
                  isDragOver={activeDropZone === `slot-${i}`}
                  onClear={() => onClearSlot(i)}
                />
              )}
            </div>
          ))}

          {/* Goal / live result */}
          <div className={`expression-equals expression-equals--${equalsState}`}>
            <span className="equals-sign">=</span>
            <span className="equals-value">{equalsValue}</span>
          </div>
          </div>
        </div>
      </div>

      <DragPalette dragging={dragging} startDrag={startDrag} />
    </div>
  );
}
