'use client'

import { useState, useEffect } from 'react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import './SalaryCounterWidget.css'

export default function SalaryCounterWidget() {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [nextSalaryDate, setNextSalaryDate] = useState<Date>(new Date())

  // Calculate the next salary date based on conditions
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
      // Move to 26th (one day before)
      nextSalary.setDate(26)
    } else if (dayOfWeek === 6) { // Saturday
      // Move to 28th (one day after)
      nextSalary.setDate(28)
    }
    
    return nextSalary
  }

  // Calculate time difference between now and target date
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
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Initialize on component mount
  useEffect(() => {
    const initialSalaryDate = calculateNextSalaryDate()
    setNextSalaryDate(initialSalaryDate)
  }, [])

  // Update countdown timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(nextSalaryDate))
    }, 1000)
    
    return () => clearInterval(timerInterval)
  }, [nextSalaryDate])

  return (
    <div className="salary-counter-widget">
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
      
      <div className="widget-content">
        <div className="countdown-container">
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.days}</div>
            <div className="countdown-label">Days</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.hours}</div>
            <div className="countdown-label">Hours</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.minutes}</div>
            <div className="countdown-label">Minutes</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-value">{timeRemaining.seconds}</div>
            <div className="countdown-label">Seconds</div>
          </div>
        </div>
      </div>
    </div>
  )
} 