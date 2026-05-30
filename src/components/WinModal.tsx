import { useState } from 'react';
import './WinModal.css';

interface WinModalProps {
  isOpen: boolean;
  stats: { streak: number; maxStreak: number; totalSolved: number };
  puzzleNumber: number;
  shareText: string;
  onClose: () => void;
}

export default function WinModal({ isOpen, stats, puzzleNumber, shareText, onClose }: WinModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silent fail
    }
  };

  return (
    <div
      className="win-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="You solved it!"
    >
      <div className="win-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="win-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="win-heading">You got it!</div>
        <div className="win-subheading">Puzzle #{puzzleNumber}</div>

        <div className="win-stats">
          <div className="win-stat">
            <div className="win-stat-value">{stats.streak}</div>
            <div className="win-stat-label">Streak</div>
          </div>
          <div className="win-stat">
            <div className="win-stat-value">{stats.maxStreak}</div>
            <div className="win-stat-label">Best</div>
          </div>
          <div className="win-stat">
            <div className="win-stat-value">{stats.totalSolved}</div>
            <div className="win-stat-label">Solved</div>
          </div>
        </div>

        <button
          className={`win-share-btn${copied ? ' copied' : ''}`}
          onClick={handleShare}
          aria-label="Share your result"
        >
          {copied ? '✓ Copied!' : '⬆ Share'}
        </button>

        <p className="win-tomorrow">Come back tomorrow for a new puzzle</p>
      </div>
    </div>
  );
}
