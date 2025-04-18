'use client'

import { ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeWrapperProps {
  children: ReactNode
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  // No longer need mounted state or loading spinner here,
  // theme class is set by the inline script in layout.tsx <head>
  return <>{children}</>
}