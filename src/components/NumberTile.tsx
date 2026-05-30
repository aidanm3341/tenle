import './NumberTile.css';

interface NumberTileProps {
  value: number;
  index: number;
  isWon: boolean;
  bracketOpenCount: number;
  bracketCloseCount: number;
  isDragOverOpen: boolean;
  isDragOverClose: boolean;
  showOpenZone: boolean;
  showCloseZone: boolean;
  onClearOpen: () => void;
  onClearClose: () => void;
}

export default function NumberTile({
  value,
  index,
  isWon,
  bracketOpenCount,
  bracketCloseCount,
  isDragOverOpen,
  isDragOverClose,
  showOpenZone,
  showCloseZone,
  onClearOpen,
  onClearClose,
}: NumberTileProps) {
  const hasOpen = bracketOpenCount > 0;
  const hasClose = bracketCloseCount > 0;

  const containerClass = [
    'number-tile-container',
    showOpenZone && 'show-open-zones',
    showCloseZone && 'show-close-zones',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      style={{ '--i': index } as React.CSSProperties}
    >
      {/* Brackets flow inline and take real space, pushing numbers apart */}
      {hasOpen && (
        <span className="bracket-label bracket-open">{'('.repeat(bracketOpenCount)}</span>
      )}

      <span className={`number-tile${isWon ? ' won' : ''}`} aria-label={`Number ${value}`}>
        {value}
      </span>

      {hasClose && (
        <span className="bracket-label bracket-close">{')'.repeat(bracketCloseCount)}</span>
      )}

      {/* Invisible drop zones — left/right halves of the whole container */}
      <div
        className={[
          'bracket-zone bz-open',
          isDragOverOpen && 'drag-over',
          hasOpen && 'has-bracket',
        ]
          .filter(Boolean)
          .join(' ')}
        data-drop={`open-${index}`}
        onClick={hasOpen ? onClearOpen : undefined}
        aria-label={hasOpen ? `Remove opening bracket (${bracketOpenCount})` : undefined}
        role={hasOpen ? 'button' : undefined}
      />
      <div
        className={[
          'bracket-zone bz-close',
          isDragOverClose && 'drag-over',
          hasClose && 'has-bracket',
        ]
          .filter(Boolean)
          .join(' ')}
        data-drop={`close-${index}`}
        onClick={hasClose ? onClearClose : undefined}
        aria-label={hasClose ? `Remove closing bracket (${bracketCloseCount})` : undefined}
        role={hasClose ? 'button' : undefined}
      />
    </div>
  );
}
