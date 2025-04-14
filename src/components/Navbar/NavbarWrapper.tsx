'use client'

import React from 'react'
import Navbar from './Navbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function NavbarWrapper() {
  return (
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>
  )
} 