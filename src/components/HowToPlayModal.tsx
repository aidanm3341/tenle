import './HowToPlayModal.css';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="help-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
    >
      <div className="help-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="help-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="help-title">How to Play</h2>

        <ol className="help-steps">
          <li className="help-step">
            <span className="help-step-num">1</span>
            <p className="help-step-text">
              You're given <strong>5 numbers</strong> in a fixed order — just like the digits on a train carriage.
            </p>
          </li>
          <li className="help-step">
            <span className="help-step-num">2</span>
            <p className="help-step-text">
              Drag an operator into the slots between numbers: <strong>+  −  ×  ÷  ^</strong> &nbsp;(<strong>^</strong> is a power, e.g. 2^3 = 8).
            </p>
          </li>
          <li className="help-step">
            <span className="help-step-num">3</span>
            <p className="help-step-text">
              Optionally drag <strong>( )</strong> brackets onto the numbers to control the order of operations. Tap a placed operator or bracket to remove it.
            </p>
          </li>
          <li className="help-step">
            <span className="help-step-num">4</span>
            <p className="help-step-text">
              Make the result equal exactly <strong>10</strong>. Standard BODMAS rules apply.
            </p>
          </li>
        </ol>

        <div className="help-example">
          <div className="help-example-label">Example</div>
          <div className="help-example-expr">3 + (2 × 4) − 1 ÷ 1</div>
          <div className="help-example-result">= 10 ✓</div>
        </div>

        <p className="help-daily-note">A new puzzle drops every day at midnight.</p>
      </div>
    </div>
  );
}
