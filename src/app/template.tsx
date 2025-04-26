/**
 * Template Component
 * 
 * This component serves as a template for Next.js pages, providing consistent layout
 * and styling across the application. It uses the PageWrapper component to wrap all
 * page content, which ensures proper theme handling and layout consistency.
 * 
 * Key features:
 * - Provides consistent layout structure for all pages
 * - Integrates with the application's theme system through PageWrapper
 * - Preserves state between page navigations
 * - Enables smooth transitions between pages
 * 
 * The Template component is part of Next.js's layout system and works with the app router
 * to maintain UI state across page transitions, improving user experience by preventing
 * full page reloads and maintaining scroll position.
 */

import PageWrapper from '@/components/PageWrapper/PageWrapper'

/**
 * Template Component
 * 
 * Wraps page content in the PageWrapper component to provide consistent layout
 * and theme handling across the application.
 * 
 * @param children - The page content to be rendered inside the template
 * @returns The wrapped page content with consistent layout and styling
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageWrapper>{children}</PageWrapper>
}