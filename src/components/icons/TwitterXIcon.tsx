/**
 * Twitter X Icon Component
 * 
 * This component renders the Twitter/X logo as an SVG icon. It's used throughout the
 * application for social media links and sharing functionality.
 * 
 * The icon uses the currentColor value for fill, which means it will inherit the text
 * color from its parent element. This allows the icon to adapt to different color schemes
 * and themes automatically, supporting both light and dark modes without requiring
 * separate implementations.
 * 
 * The component is designed to be customizable through the className prop, allowing
 * for different sizes, colors, and styles to be applied based on the context where
 * it's used.
 */

import React from 'react';

/**
 * Twitter X Icon Props Interface
 * 
 * @property className - Optional CSS class name to apply custom styling to the icon
 */
interface TwitterXIconProps {
  className?: string;
}

/**
 * Twitter X Icon Component
 * 
 * Renders the Twitter/X logo as an SVG icon with customizable styling.
 * The icon inherits its color from the parent element through currentColor,
 * making it compatible with the application's theme system for both light
 * and dark modes.
 * 
 * @param className - Optional CSS class name for custom styling (default: '')
 * @returns SVG icon component representing the Twitter/X logo
 */
const TwitterXIcon: React.FC<TwitterXIconProps> = ({ className = '' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      fill="currentColor" 
      viewBox="0 0 16 16"
      className={className}
    >
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
    </svg>
  );
};

export default TwitterXIcon;