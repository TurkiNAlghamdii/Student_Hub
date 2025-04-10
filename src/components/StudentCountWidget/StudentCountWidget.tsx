'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { UsersIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import './StudentCountWidget.css'

export default function StudentCountWidget() {
  const [studentCount, setStudentCount] = useState<number>(0)
  const [displayCount, setDisplayCount] = useState<number>(0)
  const [previousCount, setPreviousCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const countRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        // Fetch from database
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })

        if (error) throw error
        
        // Store previous count before updating
        setPreviousCount(studentCount)
        setStudentCount(count || 0)
      } catch (err: any) {
        setError('Failed to fetch student count')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentCount()
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchStudentCount, 5 * 60 * 1000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [studentCount])

  // Animate the counter when studentCount changes
  useEffect(() => {
    if (loading) return

    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    const startValue = countRef.current
    const endValue = studentCount
    const duration = 1500  // ms
    const startTime = performance.now()
    
    const animateCount = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smoother animation
      const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)
      const easedProgress = easeOutQuart(progress)
      
      const currentCount = Math.floor(startValue + (endValue - startValue) * easedProgress)
      countRef.current = currentCount
      setDisplayCount(currentCount)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateCount)
      } else {
        animationRef.current = null
      }
    }
    
    animationRef.current = requestAnimationFrame(animateCount)
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [studentCount, loading])
  
  // Format the student count with a thousands separator
  const formattedCount = displayCount.toLocaleString()
  
  // Calculate growth percentage if we have previous data
  const growthPercent = previousCount ? ((studentCount - previousCount) / previousCount * 100).toFixed(1) : null
  
  // Calculate monthly growth rate (for demo purposes)
  const monthlyGrowthRate = 5.8;
  
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

  // Only show growth if there's a non-zero change
  const showGrowth = growthPercent && parseFloat(growthPercent) !== 0;

  return (
    <div className="student-count-widget">
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
      
      <div className="widget-content">
        <div className="counts-row">
          <div className="count-section">
            <div className="count-number">{formattedCount}</div>
            <div className="count-title">Total</div>
          </div>
          <div className="count-section">
            <div className="count-number">
              <ArrowTrendingUpIcon className="trend-icon" />
              {monthlyGrowthRate}%
            </div>
            <div className="count-title">Growth/Month</div>
          </div>
        </div>
        
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