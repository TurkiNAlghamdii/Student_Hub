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
  theme: 'dark', // Default to dark theme to match the layout.tsx default
  toggleTheme: () => {},
  setTheme: () => {}
}

const ThemeContext = createContext<ThemeContextType>(defaultContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with dark theme to match server-side rendering
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on client side
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme') as Theme | null
        if (storedTheme) {
          setTheme(storedTheme)
        } else {
          // Check system preference if no stored theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const newTheme = prefersDark ? 'dark' : 'light'
          setTheme(newTheme)
          localStorage.setItem('theme', newTheme)
        }
        setMounted(true)
      }
    } catch (error) {
      console.error('Error initializing theme:', error)
      setMounted(true)
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
