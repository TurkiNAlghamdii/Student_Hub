/**
 * Pomodoro Timer Page Component
 * 
 * This client-side component provides a productivity tool implementing the Pomodoro Technique,
 * a time management method that uses timed intervals of work followed by short breaks.
 * 
 * The page includes:
 * - A fully functional Pomodoro timer with customizable work/break durations
 * - Educational content explaining the Pomodoro Technique and its benefits
 * - Responsive design that works across different device sizes
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class. This ensures
 * consistent styling and prevents flash of incorrect theme during navigation.
 * 
 * This is a public tool that doesn't require authentication, making it accessible
 * to all users of the Student Hub application.
 */

'use client'

import Navbar from '@/components/Navbar/Navbar'
import PomodoroTimer from '@/components/PomodoroTimer/PomodoroTimer'
import Footer from '@/components/Footer/Footer'
import { ClockIcon } from '@heroicons/react/24/outline'

/**
 * Pomodoro Page Component
 * 
 * Renders the Pomodoro Timer feature with educational content about the technique.
 * This component uses a responsive layout with a main timer section and an informational sidebar.
 * 
 * @returns The rendered Pomodoro page with timer and educational content
 */
export default function PomodoroPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Global navigation component */}
      <Navbar />
      
      {/* Main content container with responsive padding */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header with icon and description */}
        <div className="text-center mb-8">
          {/* Themed icon container with light/dark mode support */}
          <div className="inline-flex items-center justify-center p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <ClockIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          {/* Page title with theme-aware text color */}
          <h1 className="text-3xl font-bold dark:text-white">Pomodoro Timer</h1>
          {/* Brief description with theme-aware text color */}
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Boost your productivity with the Pomodoro Technique. Work in focused sessions separated by short breaks.
          </p>
        </div>
        
        {/* Main content grid - responsive layout that changes based on screen size */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer section - takes 2/3 of the width on large screens */}
          <div className="lg:col-span-2">
            {/* PomodoroTimer component handles all timer functionality */}
            <PomodoroTimer />
          </div>
          
          {/* Information sidebar - takes 1/3 of the width on large screens */}
          {/* Card with theme-aware styling for background, text, and shadows */}
          <div className="bg-white dark:bg-gray-900/80 shadow-md dark:shadow-xl dark:shadow-black/20 rounded-xl p-6 border border-gray-200 dark:border-gray-800 h-fit">
            {/* Section title with theme-aware text color */}
            <h2 className="text-xl font-semibold mb-4 dark:text-white">How to Use the Pomodoro Technique</h2>
            
            {/* Numbered steps list with theme-aware text colors */}
            <ol className="space-y-4 text-gray-600 dark:text-gray-300">
              {/* Step 1 with themed number badge */}
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">1</span>
                <span><strong>Choose a task</strong> you want to accomplish.</span>
              </li>
              {/* Step 2 with themed number badge */}
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">2</span>
                <span><strong>Set the timer</strong> for 25 minutes (or your preferred work duration).</span>
              </li>
              {/* Step 3 with themed number badge */}
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">3</span>
                <span><strong>Work on the task</strong> with full focus until the timer rings.</span>
              </li>
              {/* Step 4 with themed number badge */}
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">4</span>
                <span><strong>Take a short break</strong> (5 minutes) to rest and recharge.</span>
              </li>
              {/* Step 5 with themed number badge */}
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">5</span>
                <span><strong>Repeat</strong> the process. After 4 pomodoros, take a longer break (15-30 minutes).</span>
              </li>
            </ol>
            
            {/* Benefits section with themed background and borders */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              {/* Section title with theme-aware text color */}
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Benefits</h3>
              {/* Bulleted list with theme-aware text colors */}
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>Improves focus and concentration</li>
                <li>Reduces mental fatigue</li>
                <li>Increases accountability</li>
                <li>Helps manage distractions</li>
                <li>Makes tasks less overwhelming</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      {/* Global footer component */}
      <Footer />
    </div>
  )
} 