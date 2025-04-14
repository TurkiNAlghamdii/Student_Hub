'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// Provide default values for the context
const defaultContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
}

const ThemeContext = createContext<ThemeContextType>(defaultContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with a default theme that matches the server
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on client side
  useEffect(() => {
    try {
      setMounted(true)
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme') as Theme | null
        if (storedTheme) {
          setTheme(storedTheme)
        } else {
          // Check system preference if no stored theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setTheme(prefersDark ? 'dark' : 'light')
        }
      }
    } catch (error) {
      console.error('Error initializing theme:', error)
    }
  }, [])

  // Update document with theme class when theme changes
  useEffect(() => {
    if (!mounted) return
    
    try {
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(theme)
        localStorage.setItem('theme', theme)
        
        // Also update background color for dark theme
        if (theme === 'dark') {
          root.style.backgroundColor = '#111827'
        } else {
          root.style.backgroundColor = ''
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  const contextValue = {
    theme,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
