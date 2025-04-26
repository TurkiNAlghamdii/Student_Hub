/**
 * ThemeContext Module
 *
 * This context provides theme management throughout the application.
 * It handles theme switching between light and dark modes, persists user preferences,
 * and ensures a consistent theme experience across page navigation.
 *
 * Key features:
 * - Theme persistence using localStorage
 * - System preference detection for first-time users
 * - Smooth theme transitions without flashing incorrect theme
 * - Hydration-safe implementation to prevent mismatches
 * - Special handling for navigation events to maintain theme
 * - Theme-aware background color management
 */

'use client'

// Import necessary React hooks and types
import React, { createContext, useContext, useState, useEffect } from 'react'

/**
 * Type definition for supported themes
 * Currently supports 'light' and 'dark' modes
 */
type Theme = 'light' | 'dark'

/**
 * Interface defining the shape of the theme context
 * 
 * @property theme - Current active theme ('light' or 'dark')
 * @property toggleTheme - Function to toggle between light and dark themes
 * @property setTheme - Function to set the theme to a specific value
 */
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/**
 * Default values for the theme context
 * We default to dark theme to prevent flash of light content during initial load,
 * which matches the server-side rendering default in layout.tsx
 */
const defaultContext: ThemeContextType = {
  theme: 'dark', // Default to dark theme to match the layout.tsx default
  toggleTheme: () => {},
  setTheme: () => {}
}

/**
 * Create the theme context with default values
 * These defaults are used before the provider is initialized
 */
const ThemeContext = createContext<ThemeContextType>(defaultContext)

/**
 * ThemeProvider component that wraps the application and provides theme context
 * 
 * This provider handles:
 * - Theme initialization from localStorage or system preference
 * - Theme persistence
 * - Theme switching
 * - Hydration-safe theme application
 * - Background color management
 * 
 * @param props - Component props
 * @param props.children - Child components to be wrapped with the theme context
 * @returns React component that provides theme context to its children
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with dark theme to match server-side rendering
  // This prevents flash of incorrect theme during hydration
  const [theme, setTheme] = useState<Theme>('dark')
  
  // Track if component has mounted to safely apply theme
  // This helps prevent hydration mismatch errors
  const [mounted, setMounted] = useState(false)

  /**
   * Effect to initialize theme from localStorage or system preference
   * Runs once when the component mounts
   * 
   * The initialization process follows this order:
   * 1. Check localStorage for saved theme preference
   * 2. If no saved preference, check system preference (prefers-color-scheme)
   * 3. Save the determined theme to localStorage for future visits
   * 4. Mark the component as mounted to safely apply theme changes
   */
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Try to get user's saved theme preference
        const storedTheme = localStorage.getItem('theme') as Theme | null
        if (storedTheme) {
          setTheme(storedTheme)
        } else {
          // If no saved preference, check system preference
          // This gives a better first-time user experience
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const newTheme = prefersDark ? 'dark' : 'light'
          setTheme(newTheme)
          localStorage.setItem('theme', newTheme)
        }
        setMounted(true)
      }
    } catch (error) {
      console.error('Error initializing theme:', error)
      setMounted(true) // Still mark as mounted even if there's an error
    }
  }, [])

  /**
   * Effect to apply theme changes to the document
   * Runs whenever the theme changes or after component mounts
   * 
   * This effect handles:
   * 1. Applying the theme class to the HTML root element
   * 2. Saving the theme preference to localStorage
   * 3. Setting the background color based on theme
   * 4. Setting up navigation event listeners to preserve theme during page transitions
   * 
   * Note: We wait until the component is mounted to prevent hydration mismatches
   */
  useEffect(() => {
    // Don't apply theme until component is mounted to prevent hydration issues
    if (!mounted) return
    
    try {
      if (typeof window !== 'undefined') {
        // Get the root HTML element
        const root = window.document.documentElement
        
        // Remove both theme classes and add the current one
        // This ensures we don't have conflicting themes
        root.classList.remove('light', 'dark')
        root.classList.add(theme)
        
        // Save theme preference to localStorage
        localStorage.setItem('theme', theme)
        
        // Update background color based on theme
        // This helps prevent white flashes during page transitions
        const bgColor = theme === 'dark' ? '#111827' : '#ffffff'
        root.style.backgroundColor = bgColor
        
        // Add navigation event listener to prevent webpack-internal fetch errors
        // This was a tricky bug we found - theme would reset during Next.js navigation
        const handleRouteChange = () => {
          // Ensure theme is preserved during navigation
          setTimeout(() => {
            // Re-apply theme after navigation
            const currentTheme = localStorage.getItem('theme') as Theme || 'dark'
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(currentTheme)
            document.documentElement.style.backgroundColor = 
              currentTheme === 'dark' ? '#111827' : '#ffffff'
          }, 0)
        }
        
        // Clean up any existing event listeners to prevent duplicates
        window.removeEventListener('popstate', handleRouteChange)
        window.addEventListener('popstate', handleRouteChange)
        
        // Clean up function to remove event listener when component unmounts
        return () => {
          window.removeEventListener('popstate', handleRouteChange)
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }, [theme, mounted])

  /**
   * Toggles between light and dark themes
   * If current theme is light, switches to dark, and vice versa
   */
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  // Create the context value object with current theme and functions
  const contextValue = {
    theme,
    toggleTheme,
    setTheme
  }

  // Provide theme context to children components
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Custom hook to access the theme context throughout the application
 * Provides a convenient way to access theme state and functions
 * 
 * This saves developers from having to import useContext and ThemeContext
 * in every component that needs theme information
 * 
 * @returns The current theme context value
 */
export function useTheme() {
  return useContext(ThemeContext)
}
