'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import './Navbar.css'
import SearchResults from '../SearchResults/SearchResults'
import '../SearchResults/SearchResults.css'

interface NavbarProps {
  title: string
  showBack?: boolean
}

interface Course {
  course_code: string
  course_name: string
  faculty: {
    name: string
  }
}

export default function Navbar({ title, showBack = false }: NavbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Course[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside of search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search for courses when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set a timeout to avoid making too many requests while typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Add a timeout to the fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Search API error:', response.status, response.statusText)
          setSearchResults([])
          setShowResults(false)
          return
        }
        
        const data = await response.json()
        
        if (data.courses) {
          setSearchResults(data.courses)
          setShowResults(data.courses.length > 0)
        } else {
          setSearchResults([])
          setShowResults(false)
        }
      } catch (error) {
        // Handle AbortError separately
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Search request timed out');
        } else {
          console.error('Error searching courses:', error)
        }
        setSearchResults([])
        setShowResults(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchQuery.trim() && searchResults.length > 0) {
      // Navigate to the first result
      router.push(`/courses/${searchResults[0].course_code}`)
      setSearchQuery('')
      setShowResults(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <nav className="navbar">
      <div className="nav-content">
        {/* Title on the left */}
        <div className="nav-left">
          {showBack && (
            <button 
              onClick={() => router.back()}
              className="back-button mr-4"
            >
              Back
            </button>
          )}
          <h1 className="nav-title">{title}</h1>
        </div>

        {/* Search bar in the middle */}
        <div className="nav-center">
          <div className="search-form-container" ref={searchContainerRef}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true)
                    }
                  }}
                />
                {isSearching ? (
                  <div className="search-loading"></div>
                ) : (
                  <button type="submit" className="search-button">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>
            
            {/* Search Results */}
            <SearchResults 
              results={searchResults} 
              onResultClick={() => {
                setSearchQuery('')
                setShowResults(false)
              }}
              isVisible={showResults}
            />
          </div>
        </div>

        {/* Sidebar toggle on the right */}
        <div className="nav-right">
          <div className="nav-buttons">
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-button"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar (hidden by default) */}
      {isSidebarOpen && (
        <div className="sidebar">
          <div className="sidebar-content">
            <ul className="sidebar-menu">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/notifications">Notifications</Link></li>
              <li><Link href="/summer-training">Summer Training</Link></li>
              <li><Link href="/events">Events</Link></li>
              <li><Link href="/chat">Chat</Link></li>
              <li><Link href="/ai-chat">AI Chat</Link></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  )
}
