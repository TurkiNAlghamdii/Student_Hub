/**
 * Navbar Wrapper Component
 * 
 * This client-side component serves as a wrapper for the Navbar component,
 * providing it with the necessary theme context. The wrapper ensures that
 * the Navbar has access to the application's theme system regardless of
 * where it's used in the component tree.
 * 
 * Key features:
 * - Provides ThemeProvider context to the Navbar
 * - Ensures consistent theme application across the navigation
 * - Helps prevent theme flashing during navigation by ensuring theme
 *   context is available immediately when the Navbar renders
 * 
 * This component is part of the application's theme system implementation,
 * which uses CSS classes (light/dark) on the root HTML element to control
 * the visual appearance of all components. This approach prevents the flash
 * of incorrect theme that can occur when theme is applied after the page loads.
 */

'use client'

import React from 'react'
import Navbar from './Navbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

/**
 * Navbar Wrapper Component
 * 
 * Wraps the Navbar component with the ThemeProvider to ensure it has
 * access to the current theme state. This ensures the Navbar can adapt
 * its appearance based on the user's theme preference (light or dark mode).
 * 
 * The ThemeProvider context makes theme information and toggle functionality
 * available to the Navbar, which can then apply the appropriate CSS classes
 * for the current theme. This implementation helps prevent the flash of
 * incorrect theme during navigation by ensuring theme context is available
 * immediately when the component renders.
 * 
 * @returns Navbar component wrapped with ThemeProvider context
 */
export default function NavbarWrapper() {
  return (
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>
  )
}