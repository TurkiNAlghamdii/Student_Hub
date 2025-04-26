/**
 * GPA Calculator Page Component
 * 
 * This server-side component serves as the entry point for the GPA Calculator feature.
 * It defines the page metadata for SEO purposes and renders the client-side GpaCalculatorClient
 * component which contains the actual calculator functionality.
 * 
 * The page follows Next.js's App Router pattern where:
 * - This server component (page.tsx) handles metadata and initial rendering
 * - The client component (GpaCalculatorClient.tsx) handles interactive functionality
 * 
 * The component respects the application's theme system through the client component,
 * which uses CSS classes that work with both light and dark modes via the root element class.
 * This prevents the flash of incorrect theme during navigation as the theme preference
 * is applied immediately during page load through localStorage.
 */

import { Metadata } from 'next'
import GpaCalculatorClient from './GpaCalculatorClient'

/**
 * Page Metadata
 * 
 * Defines the metadata for the GPA Calculator page, including:
 * - Title: Displayed in the browser tab and used by search engines
 * - Description: Used for SEO and social media sharing
 * 
 * This metadata helps improve the page's discoverability and provides context
 * when the page is shared or appears in search results.
 */
export const metadata: Metadata = {
  title: 'GPA Calculator | Student Hub',
  description: 'Calculate your GPA and track your academic progress',
}

/**
 * GPA Calculator Page Component
 * 
 * The main page component that renders the GPA Calculator feature.
 * This is a simple wrapper that delegates all interactive functionality
 * to the client-side GpaCalculatorClient component.
 * 
 * As a server component, it doesn't include any client-side state or effects,
 * ensuring fast initial page load and SEO compatibility.
 * 
 * @returns The rendered GPA Calculator page with the client component
 */
export default function GpaCalculator() {
  return (
    <div>
      <GpaCalculatorClient />
    </div>
  )
}