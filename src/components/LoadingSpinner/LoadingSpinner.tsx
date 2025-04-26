/**
 * Loading Spinner Component
 * 
 * This component provides a visually appealing loading indicator in the shape of a hashtag (#)
 * that animates to indicate loading states throughout the application. The animation is
 * implemented using SVG lines with CSS animations for a smooth drawing effect.
 * 
 * Key features:
 * - Customizable size options (small, medium, large, xlarge)
 * - Accessible design with appropriate ARIA attributes
 * - SVG-based for crisp rendering at any size
 * - Animated drawing effect for visual interest
 * 
 * The component integrates with the application's theme system through CSS variables
 * defined in LoadingSpinner.css that adapt to both light and dark modes based on the
 * root element's theme class. This prevents theme flashing during navigation by using
 * theme-aware color variables rather than hardcoded color values.
 */

import './LoadingSpinner.css';

/**
 * Loading Spinner Props Interface
 * 
 * @property size - Optional size variant for the spinner
 *                  'small': compact size for inline or tight spaces
 *                  'medium': default size for most contexts
 *                  'large': prominent size for primary loading states
 *                  'xlarge': extra large size for full-page loading states
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

/**
 * Loading Spinner Component
 * 
 * Renders an animated hashtag-shaped loading indicator using SVG lines.
 * The animation is controlled by CSS that creates a drawing effect for each line.
 * 
 * The component uses CSS classes defined in LoadingSpinner.css that adapt to the
 * application's theme system, supporting both light and dark modes through CSS
 * variables. This ensures consistent visual appearance across theme changes and
 * prevents theme flashing during navigation.
 * 
 * @param size - Size variant for the spinner (default: 'medium')
 * @returns SVG-based loading spinner component
 */
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