'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Footer from '@/components/Footer/Footer'
import './landing.css'

/**
 * Landing Page Component
 * 
 * This client-side component serves as the main landing page for the Student Hub application.
 * It provides an introduction to the platform, showcasing key features and benefits
 * before users log in or register.
 * 
 * Key features:
 * - Hero section with call-to-action buttons
 * - Feature highlights with icons and descriptions
 * - Responsive design for all device sizes
 * - Automatic redirect for already authenticated users
 * - Theme toggle for light/dark mode preference
 */
export default function LandingPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Handle scroll effect
  const handleScroll = useCallback(() => {
    const offset = window.scrollY
    if (offset > 60) {
      setScrolled(true)
    } else {
      setScrolled(false)
    }
  }, [])

  // Update last activity timestamp to prevent session timeout
  useEffect(() => {
    // Only update if we have a session (user is logged in)
    if (session) {
      const updateActivity = () => {
        localStorage.setItem('lastActivity', Date.now().toString())
      }
      
      // Update immediately and then every 30 seconds
      updateActivity()
      const interval = setInterval(updateActivity, 30000)
      
      return () => clearInterval(interval)
    }
  }, [session])

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Simulate initial loading process
  useEffect(() => {
    // Simulate app loading process
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000) // Show loading for 1 second

    return () => clearTimeout(timer)
  }, [])

  // Only redirect authenticated users if they explicitly navigate to the landing page
  // This prevents automatic redirects after viewing the landing page
  useEffect(() => {
    // Check if this is a direct navigation to the landing page
    const isDirectNavigation = document.referrer === '' || !document.referrer.includes(window.location.host)
    
    if (session && isDirectNavigation) {
      router.push('/')
    }
  }, [session, router])

  // Only skip rendering if user is authenticated AND this is a direct navigation
  if (session && typeof window !== 'undefined' && 
      (document.referrer === '' || !document.referrer.includes(window.location.host))) {
    return null
  }

  if (loading) {
    return (
      <div className="loading-overlay fixed inset-0 z-50 flex items-center justify-center">
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }
  
  return (
    <div className="landing-container">
      {/* Navigation Bar */}
      <div className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <motion.div 
          className="nav-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="nav-left">
            <Link href="/" className="flex items-center">
              <h1 className="nav-title">
                <span className="hashtag">#</span>
                <span className="title-text"> Student_Hub</span>
              </h1>
            </Link>
          </div>
          <div className="nav-right">
            {/* Desktop Navigation Links */}
            <div className="landing-nav-links">
              <Link href="/academic-calendar" className="nav-link-item">
                <span className="nav-link-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <span className="nav-link-text">Academic Calendar</span>
              </Link>
              <Link href="/gpa-calculator" className="nav-link-item">
                <span className="nav-link-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <line x1="8" y1="6" x2="16" y2="6"></line>
                    <line x1="8" y1="10" x2="16" y2="10"></line>
                    <line x1="8" y1="14" x2="16" y2="14"></line>
                    <line x1="8" y1="18" x2="12" y2="18"></line>
                  </svg>
                </span>
                <span className="nav-link-text">GPA Calculator</span>
              </Link>
              <Link href="/pomodoro" className="nav-link-item">
                <span className="nav-link-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <span className="nav-link-text">Pomodoro Clock</span>
              </Link>
              <ThemeToggle />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </motion.div>
        
        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-nav-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-nav-links">
                <Link href="/academic-calendar" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <span className="nav-link-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                  <span className="nav-link-text">Academic Calendar</span>
                </Link>
                <Link href="/gpa-calculator" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <span className="nav-link-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                      <line x1="8" y1="6" x2="16" y2="6"></line>
                      <line x1="8" y1="10" x2="16" y2="10"></line>
                      <line x1="8" y1="14" x2="16" y2="14"></line>
                      <line x1="8" y1="18" x2="12" y2="18"></line>
                    </svg>
                  </span>
                  <span className="nav-link-text">GPA Calculator</span>
                </Link>
                <Link href="/pomodoro" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <span className="nav-link-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </span>
                  <span className="nav-link-text">Pomodoro Clock</span>
                </Link>
                <div className="mobile-theme-toggle">
                  <div className="mobile-nav-theme">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <motion.section 
        className="landing-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="landing-hero-content">
          <motion.h1 
            className="landing-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Your All-in-One Academic Platform
          </motion.h1>
          <motion.p 
            className="landing-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            All-in-one PLATFORM to make student life simpler and better!
          </motion.p>
          <motion.div 
            className="landing-cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Link href="/login" className="landing-cta-button primary">
              Log In
            </Link>
            <Link href="/register" className="landing-cta-button secondary">
              Register
            </Link>
          </motion.div>
        </div>
        <motion.div 
          className="landing-hero-image"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="placeholder-image">
            <svg
              className="animated-hash" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Define gradient for elegant look */}
              <defs>
                <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="50%" stopColor="#059669" stopOpacity="1" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Vertical lines */}
              <line className="hash-line line-1" x1="35" y1="10" x2="35" y2="90" />
              <line className="hash-line line-2" x1="65" y1="10" x2="65" y2="90" />
              {/* Horizontal lines */}
              <line className="hash-line line-3" x1="15" y1="40" x2="85" y2="40" />
              <line className="hash-line line-4" x1="15" y1="60" x2="85" y2="60" />
            </svg>
            <div className="hero-text-overlay">
              <span className="static-text">Student_Hub</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="landing-section-title title-animation">Key Features</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card card-animation card-delay-1">
            <div className="landing-feature-icon courses-icon"></div>
            <h3>Course Management</h3>
            <p>Keep track of your Course meterials and learn more about your courses.</p>
          </div>
          
          <div className="landing-feature-card card-animation card-delay-2">
            <div className="landing-feature-icon calendar-icon"></div>
            <h3>Academic Calendar & Events</h3>
            <p>Stay on top of important academic dates, deadlines, and events.</p>
          </div>
          
          <div className="landing-feature-card card-animation card-delay-3">
            <div className="landing-feature-icon gpa-icon"></div>
            <h3>Learn more about your university journey</h3>
            <p>How does the summer training work? what are the requirements for the graduation project?</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
