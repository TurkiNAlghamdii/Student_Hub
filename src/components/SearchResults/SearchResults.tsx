/**
 * Search Results Component
 * 
 * This component displays a list of course search results in a dropdown format.
 * It provides a clean, interactive interface for users to view and select courses
 * that match their search query.
 * 
 * Key features:
 * - Displays course code, name, and faculty information
 * - Handles navigation to course detail pages when a result is clicked
 * - Shows an empty state message when no results are found
 * - Integrates with the application's theme system through CSS
 * 
 * The component integrates with the application's theme system through CSS classes
 * defined in SearchResults.css that adapt to both light and dark modes based on the
 * root element's theme class. This prevents theme flashing during navigation by using
 * :root.dark and :root:not(.dark) selectors rather than hardcoded color values.
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import './SearchResults.css'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

/**
 * Course Interface
 * 
 * Defines the structure of course data displayed in search results.
 * 
 * @property course_code - Unique identifier for the course (e.g., "CS101")
 * @property course_name - Full name of the course (e.g., "Introduction to Computer Science")
 * @property faculty - Object containing faculty information
 * @property faculty.name - Name of the faculty offering the course
 */
interface Course {
  course_code: string
  course_name: string
  faculty: {
    name: string
  }
}

/**
 * Search Results Props Interface
 * 
 * Defines the props accepted by the SearchResults component.
 * 
 * @property results - Array of Course objects to display as search results
 * @property onResultClick - Callback function to execute when a result is clicked
 *                          (typically used to close the search dropdown)
 * @property isVisible - Boolean flag to control the visibility of the results dropdown
 */
interface SearchResultsProps {
  results: Course[]
  onResultClick: () => void
  isVisible: boolean
}

/**
 * Search Results Component
 * 
 * Displays a dropdown list of course search results that users can click to navigate
 * to course detail pages. The component handles both populated results and empty states.
 * 
 * The component uses CSS classes defined in SearchResults.css that adapt to the
 * application's theme system, supporting both light and dark modes through
 * :root.dark and :root:not(.dark) selectors. This ensures consistent visual
 * appearance across theme changes and prevents theme flashing during navigation.
 * 
 * @param {Course[]} results - Array of course objects to display
 * @param {Function} onResultClick - Callback function when a result is clicked
 * @param {boolean} isVisible - Whether the results dropdown should be visible
 * @returns React component for displaying search results or null when not visible
 */
export default function SearchResults({ results, onResultClick, isVisible }: SearchResultsProps) {
  // Access Next.js router for programmatic navigation
  const router = useRouter()

  // Don't render anything if the results shouldn't be visible
  if (!isVisible) {
    return null
  }

  /**
   * Handle Result Click
   * 
   * Navigates to the course detail page for the selected course and
   * executes the onResultClick callback to close the search dropdown.
   * 
   * @param {string} courseCode - The code of the selected course
   */
  const handleResultClick = (courseCode: string) => {
    router.push(`/courses/${courseCode}`)
    onResultClick()
  }

  /**
   * Render Search Results
   * 
   * Renders a dropdown container with either:  
   * 1. A list of course results when results are available
   * 2. An empty state message when no results are found
   * 
   * Each result item displays the course code, name, and faculty information,
   * and is clickable to navigate to the course detail page.
   */
  return (
    <div className="search-results-container">
      <div className="search-results">
        {results.length > 0 ? (
          /* Map through results when available */
          results.map((course) => (
            <div 
              key={course.course_code}
              className="search-result-item"
              onClick={() => handleResultClick(course.course_code)}
            >
              {/* Course code displayed prominently */}
              <div className="search-result-code">{course.course_code}</div>
              <div className="search-result-details">
                {/* Course name */}
                <div className="search-result-name">{course.course_name}</div>
                {/* Faculty information with icon */}
                <div className="search-result-faculty">
                  <AcademicCapIcon className="h-3 w-3 mr-1" />
                  {course.faculty?.name}
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty state when no results are found */
          <div className="search-result-empty">
            No courses found
          </div>
        )}
      </div>
    </div>
  )
}