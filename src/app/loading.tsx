/**
 * Loading Component
 * 
 * This component is automatically rendered by Next.js during page navigation
 * and data fetching operations. It provides a visual loading indicator to improve
 * user experience during transitions between pages or when fetching data.
 * 
 * Key features:
 * - Automatically rendered by Next.js during navigation
 * - Full-screen overlay with backdrop blur for a modern UI effect
 * - Centered loading spinner with configurable size
 * - Theme-aware styling that inherits from the root element
 * 
 * The component integrates with the application's theme system by inheriting
 * the background color set by the inline script in layout.tsx. This ensures
 * that the loading screen matches the current theme (light or dark) and prevents
 * any flash of incorrect theme during navigation.
 */

import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

/**
 * Loading Component
 * 
 * This component displays a loading spinner centered on the screen with a
 * semi-transparent backdrop. It's automatically rendered by Next.js during
 * page transitions and data fetching operations.
 * 
 * The component inherits the theme-appropriate background color set by the
 * inline script in layout.tsx, ensuring consistent theming during loading states.
 * 
 * @returns A fixed position overlay with centered loading spinner
 */
export default function Loading() {
  // This component will be rendered automatically by Next.js during navigation
  // It inherits the background set by the inline script in layout.tsx
  // Use a fixed overlay with flex centering + force hardware acceleration
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0"> 
      <LoadingSpinner size="xlarge" /> 
    </div>
  );
}
