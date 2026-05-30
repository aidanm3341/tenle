import './OperatorSlot.css';

const DISPLAY: Record<string, string> = { '-': '−' };

interface OperatorSlotProps {
  value: string | null;
  index: number;
  isDragOver: boolean;
  onClear: () => void;
}

export default function OperatorSlot({ value, index, isDragOver, onClear }: OperatorSlotProps) {
  const classes = [
    'operator-slot',
    value ? 'filled' : '',
    isDragOver ? 'drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const displayVal = value ? (DISPLAY[value] ?? value) : '';

  return (
    <div
      className={classes}
      data-drop={`slot-${index}`}
      onClick={value ? onClear : undefined}
      role={value ? 'button' : undefined}
      aria-label={
        value
          ? `Operator: ${displayVal} — tap to remove`
          : `Empty operator slot ${index + 1}`
      }
    >
      {displayVal}
    </div>
  );
}
