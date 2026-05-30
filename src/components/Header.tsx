import type { Theme } from '../hooks/useTheme';
import './Header.css';

interface HeaderProps {
  puzzleNumber: number;
  streak: number;
  theme: Theme;
  onHelpClick: () => void;
  onThemeToggle: () => void;
}

export default function Header({ puzzleNumber, streak, theme, onHelpClick, onThemeToggle }: HeaderProps) {
  return (
    <header className="header">
      <button
        className="header-btn"
        onClick={onHelpClick}
        aria-label="How to play"
      >
        ?
      </button>

      <div className="header-center">
        <div className="header-title">TENLE</div>
        <div className="header-puzzle-num">#{puzzleNumber}</div>
      </div>

      <div className="header-right">
        {streak > 0 && (
          <div className="header-streak" aria-label={`Current streak: ${streak}`}>
            <span className="header-streak-icon">🔥</span>
            <span className="header-streak-count">{streak}</span>
          </div>
        )}
        <button
          className="header-btn header-theme-btn"
          onClick={onThemeToggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>
    </header>
  );
}
