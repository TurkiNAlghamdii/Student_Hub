'use client'

import { ReactNode } from 'react'
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper'

interface PageWrapperProps {
  children: ReactNode
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <ThemeWrapper>
      {children}
    </ThemeWrapper>
  )
} 