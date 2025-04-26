/**
 * Page Wrapper Component
 * 
 * This client-side component serves as a wrapper for page content, providing
 * consistent theme application across the application. It ensures that all
 * child components have access to the theme context and styling.
 * 
 * Key features:
 * - Provides ThemeWrapper context to page content
 * - Ensures consistent theme application across all pages
 * - Helps prevent theme flashing during navigation by ensuring theme
 *   context is available immediately when the page renders
 * 
 * This component is a critical part of the application's theme system implementation,
 * which uses CSS classes (light/dark) on the root HTML element to control
 * the visual appearance of all components. This approach prevents the flash
 * of incorrect theme that can occur when theme is applied after the page loads,
 * addressing the issue where pages initially load in light mode before switching
 * to dark mode during navigation.
 */

'use client'

import { ReactNode } from 'react'
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper'

/**
 * Page Wrapper Props Interface
 * 
 * @property children - The child components/content to be wrapped with theme context
 */
interface PageWrapperProps {
  children: ReactNode
}

/**
 * Page Wrapper Component
 * 
 * Wraps page content with the ThemeWrapper to ensure consistent theme application.
 * This component ensures that all pages have immediate access to the current theme
 * state, preventing the flash of incorrect theme during navigation.
 * 
 * The ThemeWrapper applies the appropriate theme class to the root HTML element
 * before any content renders, solving the issue where pages initially load in light
 * mode before switching to dark mode. It uses localStorage to remember the user's
 * theme preference and applies it immediately during page load.
 * 
 * @param children - The page content to be wrapped with theme context
 * @returns Page content wrapped with ThemeWrapper for consistent theme application
 */
export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <ThemeWrapper>
      {children}
    </ThemeWrapper>
  )
}