'use client'

import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import './ThemeToggle.css'

interface SafeThemeToggleProps {
  className?: string
}

export default function SafeThemeToggle({ className = '' }: SafeThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage or document class
    const root = window.document.documentElement
    const initialTheme = root.classList.contains('dark') ? 'dark' : 'light'
    setTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // Update document
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Update background color
    if (newTheme === 'dark') {
      root.style.backgroundColor = '#111827'
    } else {
      root.style.backgroundColor = ''
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-button ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
} 