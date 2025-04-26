/**
 * Course Detail Loading Component
 * 
 * This component is automatically used by Next.js during route transitions
 * and data fetching for the course detail page. It provides a visual loading
 * indicator to improve user experience while course data is being fetched.
 * 
 * The component leverages Next.js 13+ app router's loading state convention,
 * where a loading.tsx file in a route segment automatically creates a
 * loading UI that's shown while the main page component is loading.
 * 
 * The LoadingSpinner component used here is designed to be compatible with
 * the application's theme system, displaying appropriately in both light and
 * dark modes through CSS classes that respond to the root element's theme class.
 * 
 * @returns A centered loading spinner component that visually indicates
 *          content is being loaded
 */
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

/**
 * Loading Component
 * 
 * Renders a loading spinner while the course detail page is loading.
 * This provides immediate visual feedback to users during navigation
 * and data fetching operations.
 */
export default function Loading() {
  return <LoadingSpinner />
}
