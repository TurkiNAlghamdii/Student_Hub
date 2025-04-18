import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export default function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  return (
    // Replace divs with SVG for drawing effect
    <svg
      className={`loading-hash-svg size-${size}`}
      viewBox="0 0 100 100" // Define coordinate system
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading"
    >
      {/* Lines forming the '#' */}
      {/* Vertical lines */}
      <line className="hash-line line-1" x1="35" y1="10" x2="35" y2="90" />
      <line className="hash-line line-2" x1="65" y1="10" x2="65" y2="90" />
      {/* Horizontal lines */}
      <line className="hash-line line-3" x1="15" y1="40" x2="85" y2="40" />
      <line className="hash-line line-4" x1="15" y1="60" x2="85" y2="60" />
    </svg>
  );
}