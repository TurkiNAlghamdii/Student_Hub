/**
 * ThemeToggle Component
 *
 * This component provides a button that allows users to toggle between light and dark themes.
 * It integrates with the application's ThemeContext to manage theme state and persistence.
 *
 * Key features:
 * - Accessible button with appropriate ARIA attributes
 * - Visual feedback with icon changes between sun and moon
 * - Smooth transitions and hover effects defined in CSS
 * - Contextual positioning in different layouts (navbar, sidebar, auth pages)
 * - Responsive design that adapts to different screen sizes
 */

'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import './ThemeToggle.css'

/**
 * Props interface for the ThemeToggle component
 * @property className - Optional CSS class name to allow styling customization
 *                       from parent components (e.g., positioning in navbar vs sidebar)
 */
interface ThemeToggleProps {
  className?: string
}

/**
 * ThemeToggle component implementation
 * 
 * This component renders a button that toggles between light and dark themes.
 * It consumes the ThemeContext to access the current theme state and toggle function.
 * 
 * @param props - Component props
 * @param props.className - Optional CSS class name for custom styling
 * @returns React component with a theme toggle button
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  // Access theme state and toggle function from context
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      // Combine base styles with any custom classes passed as props
      className={`theme-toggle-button ${className}`}
      // Accessibility attributes that change based on current theme
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Show sun icon in dark mode, moon icon in light mode */}
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}
