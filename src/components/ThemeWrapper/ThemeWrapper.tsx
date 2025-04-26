/**
 * ThemeWrapper Component
 *
 * This component serves as a lightweight wrapper for the application's theme system.
 * It previously handled theme initialization and loading states, but now most of that
 * functionality has been moved to an inline script in layout.tsx to prevent theme flashing.
 *
 * The component still imports the ThemeContext to maintain connection with the theme system,
 * but it no longer directly manipulates theme classes on the HTML element.
 * 
 * This approach addresses the issue where pages initially loaded in light mode before
 * switching to dark mode, causing a flash of light content during navigation.
 */

'use client'

import { ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Props interface for the ThemeWrapper component
 * @property children - React nodes to be wrapped by the ThemeWrapper
 *                      This allows the component to wrap any part of the application
 */
interface ThemeWrapperProps {
  children: ReactNode
}

/**
 * ThemeWrapper component implementation
 * 
 * This component is now a simple pass-through wrapper that renders its children directly.
 * The actual theme application happens via an inline script in the document head that sets
 * the theme class before any content renders, preventing the flash of incorrect theme.
 * 
 * Previously, this component would:  
 * 1. Check localStorage for a saved theme preference
 * 2. Apply the appropriate theme class to the HTML element
 * 3. Show a loading spinner while the theme was being applied
 * 
 * Now it simply renders its children, as the theme is applied earlier in the rendering process.
 * 
 * @param props - Component props
 * @param props.children - Child components to be rendered
 * @returns React fragment containing the children
 */
export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  // No longer need mounted state or loading spinner here,
  // theme class is set by the inline script in layout.tsx <head>
  return <>{children}</>
}