/**
 * StudentCountWidget Component
 * 
 * This component displays a real-time counter of registered students in the system.
 * It features animated counting, growth indicators, and theme integration.
 * 
 * Key features:
 * - Fetches real student count data from Supabase database
 * - Animates count changes with smooth transitions
 * - Displays growth percentage and monthly growth rate
 * - Adapts to light/dark theme using the application's theme system
 * - Shows loading and error states appropriately
 * 
 * The component uses requestAnimationFrame for smooth counter animations
 * and includes a "Live" indicator to show real-time data status.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { UsersIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import './StudentCountWidget.css'

export default function StudentCountWidget() {
  // State to store the actual student count from the database
  const [studentCount, setStudentCount] = useState<number>(0)
  
  // State to store the currently displayed count during animation
  const [displayCount, setDisplayCount] = useState<number>(0)
  
  // State to store the previous count for calculating growth percentage
  const [previousCount, setPreviousCount] = useState<number | null>(null)
  
  // Loading and error states for handling data fetching
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Ref to track the current count during animation without re-renders
  const countRef = useRef<number>(0)
  
  // Ref to store the animation frame ID for cleanup
  const animationRef = useRef<number | null>(null)

  /**
   * Effect to fetch student count data from Supabase
   * 
   * This effect runs when the component mounts and sets up an interval
   * to refresh the data every 5 minutes. It also handles error states
   * and updates the previous count for growth calculations.
   */
  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        // Fetch from database using Supabase client
        // We only need the count, not the actual records
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })

        if (error) throw error
        
        // Store previous count before updating for growth calculation
        setPreviousCount(studentCount)
        setStudentCount(count || 0)
      } catch (err: any) {
        setError('Failed to fetch student count')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch when component mounts
    fetchStudentCount()
    
    // Set up interval to refresh data every 5 minutes to keep count current
    const intervalId = setInterval(fetchStudentCount, 5 * 60 * 1000)
    
    // Clean up interval on component unmount to prevent memory leaks
    return () => clearInterval(intervalId)
  }, [studentCount])

  /**
   * Effect to animate the counter when studentCount changes
   * 
   * This effect creates a smooth animation from the previous count to the new count
   * using requestAnimationFrame for optimal performance. It includes an easing function
   * for a more natural animation feel and handles cleanup of animation frames.
   */
  useEffect(() => {
    // Skip animation while loading
    if (loading) return

    // Cancel any ongoing animation to prevent conflicts
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    // Set up animation parameters
    const startValue = countRef.current
    const endValue = studentCount
    const duration = 1500  // Animation duration in milliseconds
    const startTime = performance.now()
    
    /**
     * Animation frame callback function
     * Calculates the current count based on elapsed time and easing
     */
    const animateCount = (timestamp: number) => {
      // Calculate progress (0 to 1) based on elapsed time
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Apply easing function for smoother animation
      // easeOutQuart provides a quick start and gentle finish
      const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)
      const easedProgress = easeOutQuart(progress)
      
      // Calculate and set the current count based on progress
      const currentCount = Math.floor(startValue + (endValue - startValue) * easedProgress)
      countRef.current = currentCount
      setDisplayCount(currentCount)
      
      // Continue animation if not complete
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateCount)
      } else {
        animationRef.current = null
      }
    }
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animateCount)
    
    // Cleanup function to cancel animation when component unmounts or count changes
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [studentCount, loading])
  
  /**
   * Format and calculate display values
   */
  // Format the student count with a thousands separator for better readability
  const formattedCount = displayCount.toLocaleString()
  
  // Calculate growth percentage if we have previous data
  // This shows the change since the last data refresh
  const growthPercent = previousCount ? ((studentCount - previousCount) / previousCount * 100).toFixed(1) : null
  
  // Calculate monthly growth rate (for demo purposes)
  // In a production app, this would be calculated from historical data
  const monthlyGrowthRate = 5.8;
  
  /**
   * Conditional rendering for loading and error states
   * 
   * The component shows a loading spinner while data is being fetched
   * and an error message if the fetch operation fails.
   * 
   * The student-count-widget class applies theme-specific styling
   * through CSS variables and theme class selectors.
   */
  if (loading) {
    return (
      <div className="student-count-widget">
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="student-count-widget">
        <div className="flex items-center justify-center h-full text-red-400">
          {error}
        </div>
      </div>
    )
  }

  /**
   * Determine whether to show growth indicator
   * Only display growth indicator when there's an actual non-zero change
   * to avoid showing meaningless indicators
   */
  const showGrowth = growthPercent && parseFloat(growthPercent) !== 0;

  /**
   * Main component render
   * 
   * The component structure:
   * 1. Widget header with title and live status indicator
   * 2. Widget content with count sections
   *    - Total students count with animation
   *    - Monthly growth rate
   * 3. Conditional growth indicator showing recent changes
   * 
   * The component uses CSS classes that adapt to the current theme
   * through the application's theme system (light/dark modes).
   */
  return (
    <div className="student-count-widget">
      {/* Widget header with title and live status */}
      <div className="widget-header">
        <div className="widget-title-container">
          <UsersIcon className="widget-icon" />
          <h3 className="widget-title">Registered Students</h3>
        </div>
        <div className="active-status-indicator">
          <span className="pulse-dot"></span>
          <span>Live</span>
        </div>
      </div>
      
      {/* Widget main content */}
      <div className="widget-content">
        {/* Count sections row with total and growth rate */}
        <div className="counts-row">
          {/* Total students count section */}
          <div className="count-section">
            <div className="count-number">{formattedCount}</div>
            <div className="count-title">Total</div>
          </div>
          {/* Monthly growth rate section */}
          <div className="count-section">
            <div className="count-number">
              <ArrowTrendingUpIcon className="trend-icon" />
              {monthlyGrowthRate}%
            </div>
            <div className="count-title">Growth/Month</div>
          </div>
        </div>
        
        {/* Conditional growth indicator showing recent change */}
        {showGrowth && (
          <div className="growth-indicator">
            <div className={`growth-pill ${parseFloat(growthPercent) > 0 ? 'positive' : 'negative'}`}>
              <span className="growth-value">
                {parseFloat(growthPercent) > 0 
                  ? `↑ ${growthPercent}%` 
                  : `↓ ${Math.abs(parseFloat(growthPercent))}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}