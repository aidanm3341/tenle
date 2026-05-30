import './DragPalette.css';
import type { DragItem, OperatorSymbol } from '../types';

const OPERATOR_CHIPS: { value: OperatorSymbol; display: string }[] = [
  { value: '+', display: '+' },
  { value: '-', display: '−' },
  { value: '×', display: '×' },
  { value: '÷', display: '÷' },
  { value: '^', display: '^' },
];

const BRACKET_CHIPS = [
  { value: 'open' as const, display: '(' },
  { value: 'close' as const, display: ')' },
];

interface DragPaletteProps {
  dragging: DragItem | null;
  startDrag: (item: DragItem, e: React.PointerEvent) => void;
}

export default function DragPalette({ dragging, startDrag }: DragPaletteProps) {
  return (
    <div className="drag-palette">
      <p className="drag-palette-label">Drag to place</p>
      <div className="drag-palette-chips">
        {OPERATOR_CHIPS.map((chip) => {
          const isDraggingThis =
            dragging?.kind === 'operator' && dragging.value === chip.value;
          return (
            <button
              key={chip.value}
              className={`palette-chip operator-chip${isDraggingThis ? ' dragging-this' : ''}`}
              onPointerDown={(e) => startDrag({ kind: 'operator', value: chip.value }, e)}
              aria-label={`${chip.display} operator — drag to place`}
              style={{ touchAction: 'none' }}
            >
              {chip.display}
            </button>
          );
        })}
        {BRACKET_CHIPS.map((chip) => {
          const isDraggingThis =
            dragging?.kind === 'bracket' && dragging.value === chip.value;
          return (
            <button
              key={chip.value}
              className={`palette-chip bracket-chip${isDraggingThis ? ' dragging-this' : ''}`}
              onPointerDown={(e) => startDrag({ kind: 'bracket', value: chip.value }, e)}
              aria-label={`${chip.display} bracket — drag to place`}
              style={{ touchAction: 'none' }}
            >
              {chip.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}
