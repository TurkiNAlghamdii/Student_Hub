/**
 * Summer Training Page Component
 * 
 * This client-side component provides information about summer training programs
 * and requirements for students. It serves as a central hub for students to access
 * guidance about summer training opportunities and view potential training institutions.
 * 
 * Key features:
 * - Comprehensive summer training guide with requirements and procedures
 * - Table of training institutions with contact information
 * - Animated content transitions for improved user experience
 * 
 * The component integrates with the application's theme system through CSS classes
 * and conditional styling that adapt to both light and dark modes via the root element class.
 * The styling in this component uses dark: prefixed classes for dark mode styling,
 * ensuring consistent appearance and preventing flash of incorrect theme during navigation.
 */

'use client'

import Navbar from '@/components/Navbar/Navbar'
import SummerTrainingGuide from '@/components/SummerTrainingGuide/SummerTrainingGuide'
import TrainingInstitutionsTable from '@/components/TrainingInstitutionsTable/TrainingInstitutionsTable'
import { BriefcaseIcon } from '@heroicons/react/24/outline'
import AnimatedContent from '@/components/AnimatedContent'
import './summer-training.css'

/**
 * Summer Training Page Component
 * 
 * This component renders the main summer training page, providing students with
 * information about training programs, requirements, and potential institutions.
 * 
 * The page is structured with:
 * 1. A navigation bar at the top
 * 2. A header section with a title and brief description
 * 3. A main content section containing:
 *    - A comprehensive summer training guide
 *    - A table of training institutions
 * 
 * All content is wrapped in an AnimatedContent component for smooth transitions
 * when the page loads or when navigating to this page.
 * 
 * @returns The rendered Summer Training page
 */
export default function SummerTrainingPage() {
  return (
    <div className="summer-training-container">
      {/* Navigation bar component */}
      <Navbar />
      
      {/* Main content area with responsive padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Animated wrapper for smooth content transitions */}
        <AnimatedContent>
          {/* Header Section with title and icon */}
          <div className="welcome-section rounded-2xl p-6 relative overflow-hidden">
            <div className="welcome-container relative z-1">
              <div className="greeting-content flex items-center gap-4">
                {/* Icon container with emerald accent color */}
                <div className="greeting-icon rounded-full p-3 flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-emerald-400" />
                </div>
                {/* Title and description with theme-aware text colors */}
                <div>
                  <h1 className="text-3xl font-bold dark:text-white text-gray-800">Summer Training</h1>
                  <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Information about summer training programs and requirements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="content-section space-y-8">
            {/* Summer Training Guide Component */}
            <SummerTrainingGuide />
            
            {/* Training Institutions Table Section */}
            {/* Container with theme-aware styling using dark: prefix classes */}
            <div className="dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/80 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50 backdrop-blur-sm rounded-2xl p-6 border">
              <TrainingInstitutionsTable />
            </div>
          </div>
        </AnimatedContent>
      </main>
    </div>
  )
}