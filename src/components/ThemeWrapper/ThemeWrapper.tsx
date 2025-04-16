'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import './ThemeWrapper.css'

interface ThemeWrapperProps {
  children: ReactNode
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted after initial theme is set
    setMounted(true)
  }, [])

  // Don't render children until mounted to prevent theme flash
  if (!mounted) {
    return (
      <div className="theme-loading-container">
        <LoadingSpinner size="medium" />
      </div>
    )
  }

  return <>{children}</>
} 