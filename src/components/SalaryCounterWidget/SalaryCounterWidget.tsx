/**
 * Salary Counter Widget Component
 * 
 * This client-side component displays a countdown timer to the next student reward payment date.
 * It provides a visual representation of days, hours, minutes, and seconds remaining until
 * the next payment, helping students plan their finances.
 * 
 * Key features:
 * - Automatically calculates the next payment date (typically the 27th of each month)
 * - Adjusts for weekends (moves to 26th if Friday, 28th if Saturday)
 * - Real-time countdown with days, hours, minutes, and seconds
 * - Responsive design that adapts to different screen sizes
 * 
 * The component integrates with the application's theme system through CSS classes
 * defined in SalaryCounterWidget.css that adapt to both light and dark modes based on the
 * root element's theme class. This prevents theme flashing during navigation by using
 * :root.dark and :root:not(.dark) selectors rather than hardcoded color values in the JSX.
 */

'use client'

import { useState, useEffect } from 'react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import './SalaryCounterWidget.css'

/**
 * Time Remaining Interface (implicit)
 * 
 * @property days - Number of days remaining until next payment
 * @property hours - Number of hours remaining (after days are calculated)
 * @property minutes - Number of minutes remaining (after hours are calculated)
 * @property seconds - Number of seconds remaining (after minutes are calculated)
 */

/**
 * Salary Counter Widget Component
 * 
 * Displays a countdown timer to the next student reward payment date.
 * The component calculates the next payment date based on the current date,
 * adjusting for weekends, and provides a real-time countdown.
 * 
 * The component uses CSS classes defined in SalaryCounterWidget.css that adapt to the
 * application's theme system, supporting both light and dark modes through
 * :root.dark and :root:not(.dark) selectors. This ensures consistent visual
 * appearance across theme changes and prevents theme flashing during navigation.
 * 
 * @returns React component for displaying the salary countdown widget
 */
export default function SalaryCounterWidget() {
  // State to track time remaining until next payment
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  // State to store the calculated next payment date
  const [nextSalaryDate, setNextSalaryDate] = useState<Date>(new Date())

  /**
   * Calculate Next Salary Date
   * 
   * Determines the next student reward payment date based on the current date.
   * By default, payments are made on the 27th of each month, but this function
   * handles special cases:
   * 
   * 1. If today is after the 27th, it calculates the date for next month
   * 2. If the 27th falls on a Friday, payment is moved to the 26th (one day earlier)
   * 3. If the 27th falls on a Saturday, payment is moved to the 28th (one day later)
   * 
   * @returns {Date} The calculated next payment date
   */
  const calculateNextSalaryDate = () => {
    const today = new Date()
    let nextSalary = new Date(today.getFullYear(), today.getMonth(), 27)
    
    // If today is after the 27th of this month, move to next month
    if (today.getDate() > 27 || 
        (today.getDate() === 27 && today.getHours() >= 0)) {
      nextSalary = new Date(today.getFullYear(), today.getMonth() + 1, 27)
    }
    
    // Check if the next salary day falls on Friday (5) or Saturday (6)
    const dayOfWeek = nextSalary.getDay()
    
    if (dayOfWeek === 5) { // Friday
      // Move to 26th (one day before) since payments aren't processed on weekends
      nextSalary.setDate(26)
    } else if (dayOfWeek === 6) { // Saturday
      // Move to 28th (one day after) since payments aren't processed on weekends
      nextSalary.setDate(28)
    }
    
    return nextSalary
  }

  /**
   * Calculate Time Remaining
   * 
   * Computes the time difference between the current date/time and the target payment date.
   * This function breaks down the time difference into days, hours, minutes, and seconds
   * for display in the countdown timer.
   * 
   * If the target date is in the past (difference <= 0), it recalculates the next payment date
   * and returns zeros for all time units to prevent negative values in the countdown.
   * 
   * @param {Date} targetDate - The target payment date to calculate time until
   * @returns {Object} Object containing days, hours, minutes, and seconds remaining
   */
  const calculateTimeRemaining = (targetDate: Date) => {
    const now = new Date()
    const difference = targetDate.getTime() - now.getTime()
    
    if (difference <= 0) {
      // If target date is in the past, recalculate the next salary date
      const newSalaryDate = calculateNextSalaryDate()
      setNextSalaryDate(newSalaryDate)
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  }
  
  /**
   * Format Date for Display
   * 
   * Converts a Date object into a human-readable string format.
   * Uses locale-specific formatting to display the weekday, month, day, and year.
   * 
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string (e.g., "Friday, April 26, 2025")
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Initialize Component
   * 
   * This effect runs once when the component mounts to calculate and set
   * the initial next payment date. This ensures the countdown starts with
   * the correct target date as soon as the component is rendered.
   */
  useEffect(() => {
    const initialSalaryDate = calculateNextSalaryDate()
    setNextSalaryDate(initialSalaryDate)
  }, [])

  /**
   * Update Countdown Timer
   * 
   * Sets up an interval that recalculates the time remaining every second.
   * This creates the effect of a real-time countdown timer that updates dynamically.
   * The interval is cleared when the component unmounts or when the nextSalaryDate changes.
   * 
   * The dependency on nextSalaryDate ensures that if the target date changes
   * (e.g., after passing a payment date), the timer resets with the new target.
   */
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(nextSalaryDate))
    }, 1000)
    
    // Clean up interval on component unmount or when nextSalaryDate changes
    return () => clearInterval(timerInterval)
  }, [nextSalaryDate])

  /**
   * Render the Salary Counter Widget
   * 
   * The component is structured with:
   * 1. A header section containing the title and next payment date
   * 2. A content section displaying the countdown timer with days, hours, minutes, and seconds
   * 
   * The widget uses CSS classes defined in SalaryCounterWidget.css that adapt to the
   * application's theme system through :root.dark and :root:not(.dark) selectors.
   */
  return (
    <div className="salary-counter-widget">
      {/* Widget header with title and next payment date information */}
      <div className="widget-header">
        <div className="widget-title-container">
          <CurrencyDollarIcon className="widget-icon" />
          <h3 className="widget-title">Student Reward</h3>
        </div>
        <div className="widget-actions">
          <button
            className="counter-info-button"
          >
            <span>Next: {formatDate(nextSalaryDate)}</span>
          </button>
        </div>
      </div>
      
      {/* Widget content with countdown timer */}
      <div className="widget-content">
        <div className="countdown-container">
          {/* Days counter */}
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.days}</div>
            <div className="countdown-label">Days</div>
          </div>
          <div className="countdown-separator">:</div>
          {/* Hours counter */}
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.hours}</div>
            <div className="countdown-label">Hours</div>
          </div>
          <div className="countdown-separator">:</div>
          {/* Minutes counter */}
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.minutes}</div>
            <div className="countdown-label">Minutes</div>
          </div>
          <div className="countdown-separator">:</div>
          {/* Seconds counter */}
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.seconds}</div>
            <div className="countdown-label">Seconds</div>
          </div>
        </div>
      </div>
    </div>
  )
}