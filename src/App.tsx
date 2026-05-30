import { useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { useDragDrop } from './hooks/useDragDrop';
import { useTheme } from './hooks/useTheme';
import type { DragItem, OperatorSymbol } from './types';
import { formatDuration } from './utils/time';
import Header from './components/Header';
import PuzzleBoard from './components/PuzzleBoard';
import WinModal from './components/WinModal';
import HowToPlayModal from './components/HowToPlayModal';

const OP_DISPLAY: Record<string, string> = { '-': '−' };

function App() {
  const { theme, toggleTheme } = useTheme();
  const g = useGameState();
  const shareText = g.isSolved ? g.getShareText() : '';

  const handleDrop = useCallback(
    (item: DragItem, zoneId: string) => {
      if (item.kind === 'operator') {
        const match = zoneId.match(/^slot-(\d)$/);
        if (match) g.setOperator(item.value as OperatorSymbol, parseInt(match[1]));
      } else {
        const match = zoneId.match(/^(open|close)-(\d)$/);
        if (match) {
          const type = match[1] as 'open' | 'close';
          const position = parseInt(match[2]);
          g.placeBracket(position, type);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g.setOperator, g.placeBracket]
  );

  const { dragging, activeDropZone, ghostPos, startDrag } = useDragDrop(handleDrop);

  return (
    <div className="app">
      <Header
        puzzleNumber={g.puzzleNumber}
        streak={g.stats.streak}
        theme={theme}
        onHelpClick={g.openHelpModal}
        onThemeToggle={toggleTheme}
      />
      <main className="app-main">
        <p className="app-intro">
          Drag operators between the numbers to make the line equal <strong>10</strong>.
        </p>
        {g.isArchive && (
          <div className="archive-banner">
            <span className="archive-banner-label">Archive · Puzzle #{g.puzzleNumber}</span>
            <a className="archive-banner-link" href={import.meta.env.BASE_URL}>Today →</a>
          </div>
        )}
        <div className={`game-timer${g.isSolved ? ' solved' : ''}`} aria-label="Elapsed time">
          {formatDuration(g.elapsedSeconds)}
        </div>
        <PuzzleBoard
          numbers={g.puzzle.numbers}
          operators={g.operators}
          brackets={g.brackets}
          dragging={dragging}
          activeDropZone={activeDropZone}
          isWon={g.isSolved}
          result={g.result}
          isComplete={g.isComplete}
          isBracketValid={g.isBracketValid}
          startDrag={startDrag}
          onClearSlot={g.clearOperator}
          onClearBracket={g.removeBracket}
        />
      </main>

      {/* Drag ghost — follows the pointer */}
      {ghostPos && dragging && (
        <div
          className={`drag-ghost${dragging.kind === 'bracket' ? ' bracket-ghost' : ''}`}
          style={{ left: ghostPos.x, top: ghostPos.y }}
          aria-hidden="true"
        >
          {dragging.kind === 'operator'
            ? (OP_DISPLAY[dragging.value] ?? dragging.value)
            : dragging.value === 'open' ? '(' : ')'}
        </div>
      )}

      <WinModal
        isOpen={g.isWinModalOpen}
        stats={g.stats}
        puzzleNumber={g.puzzleNumber}
        solveSeconds={g.solveSeconds}
        shareText={shareText}
        onClose={g.closeWinModal}
      />
      <HowToPlayModal
        isOpen={g.isHelpModalOpen}
        onClose={g.closeHelpModal}
      />
    </div>
  );
}

export default App;
