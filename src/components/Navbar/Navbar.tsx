/**
 * Navbar Component
 * 
 * This client-side component provides the main navigation interface for the Student Hub
 * application. It includes a responsive top navigation bar and a collapsible sidebar
 * with links to all major sections of the application.
 * 
 * Key features:
 * - Responsive design that adapts to different screen sizes
 * - Collapsible sidebar with compact/expanded modes
 * - Search functionality for courses
 * - User profile display and authentication controls
 * - Role-based navigation (admin vs. student views)
 * - Theme toggle integration
 * 
 * The component integrates with the application's theme system through CSS classes
 * defined in Navbar.css that adapt to both light and dark modes based on the root
 * element's theme class. This prevents theme flashing during navigation by using
 * theme-aware selectors rather than hardcoded color values in the JSX.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  AcademicCapIcon,
  BellIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  CalculatorIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import './Navbar.css'
import SearchResults from '../SearchResults/SearchResults'
import '../SearchResults/SearchResults.css'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

/**
 * Navbar Props Interface
 * 
 * @property showBack - Optional boolean to show a back button in the navbar
 *                      (used for nested pages where navigation context is helpful)
 */
interface NavbarProps {
  showBack?: boolean
}

/**
 * Course Interface
 * 
 * Defines the structure of course data used in search results.
 * 
 * @property course_code - Unique identifier for the course (e.g., 'CS101')
 * @property course_name - Full name of the course
 * @property faculty - Object containing faculty information
 */
interface Course {
  course_code: string
  course_name: string
  faculty: {
    name: string
  }
}

/**
 * Student Profile Interface
 * 
 * Defines the structure of student profile data retrieved from Supabase.
 * 
 * @property id - Unique identifier for the student
 * @property full_name - Optional full name of the student
 * @property avatar_url - Optional URL to the student's avatar image
 */
interface StudentProfile {
  id: string
  full_name?: string
  avatar_url?: string
  // Other profile fields can be added as needed
}

/**
 * Navbar Component
 * 
 * The main navigation component for the Student Hub application, providing access
 * to all major sections and features. It includes a responsive top bar, collapsible
 * sidebar, search functionality, and user profile management.
 * 
 * The component uses CSS classes defined in Navbar.css that adapt to the application's
 * theme system, supporting both light and dark modes through the root element's theme
 * class. This ensures consistent visual appearance across theme changes and prevents
 * theme flashing during navigation.
 * 
 * @param showBack - Whether to show a back button in the navbar (default: false)
 * @returns React component for the application navigation
 */
export default function Navbar({ showBack = false }: NavbarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Course[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // Sidebar animation states
  // These work together to create smooth open/close transitions
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)      // Controls if sidebar is in the DOM
  const [isSidebarClosing, setIsSidebarClosing] = useState(false) // Tracks if sidebar is in closing animation
  const [isSidebarMounted, setIsSidebarMounted] = useState(false) // Controls when animations should start
  const [isBackdropActive, setIsBackdropActive] = useState(false) // Controls backdrop visibility
  
  // User profile and role state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // State for sidebar compact mode with localStorage persistence
  // This lets users keep their preferred sidebar width between sessions
  const [isCompactMode, setIsCompactMode] = useState(() => {
    // Check localStorage for saved preference, default to false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCompact')
      return saved === 'true'
    }
    return false
  })
  
  // Refs for managing search and sidebar functionality
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Save compact mode preference whenever it changes
  // This ensures user preference persists between sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCompact', isCompactMode.toString())
    }
  }, [isCompactMode])

  // Fetch student profile including avatar
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;

      try {
        // Fetch directly from database without using localStorage
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching student profile:', error);
          return;
        }
        
        if (data) {
          setStudentProfile(data);
        }
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };
    
    fetchStudentProfile();
  }, [user]);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const isUserAdmin = user.app_metadata?.is_admin === true || 
                         user.app_metadata?.is_admin === 'true' || 
                         String(user.app_metadata?.is_admin).toLowerCase() === 'true'
      setIsAdmin(isUserAdmin)
    }
  }, [user])

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

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        closeSidebar()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isSidebarOpen])

  // Handle sidebar animation end
  useEffect(() => {
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === 'transform' && isSidebarClosing) {
        // Only clean up state after animation completes
        setIsSidebarOpen(false)
        setIsSidebarClosing(false)
      }
    }

    const sidebarElement = sidebarRef.current
    if (sidebarElement) {
      sidebarElement.addEventListener('transitionend', handleTransitionEnd)
      return () => {
        sidebarElement.removeEventListener('transitionend', handleTransitionEnd)
      }
    }
  }, [isSidebarClosing])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  // Search for courses when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a timeout to avoid making too many requests while typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Add a timeout to the fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Format the search query to handle special characters and spaces
        const formattedQuery = searchQuery.trim().replace(/[%_]/g, '\\$&');
        
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(formattedQuery)}`,
          { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            method: 'GET',
            cache: 'no-store'
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Search API error:', response.status, response.statusText, errorData);
          setSearchResults([]);
          setShowResults(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.courses) {
          setSearchResults(data.courses);
          setShowResults(data.courses.length > 0);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        // Handle AbortError separately
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Search request timed out');
        } else {
          console.error('Error searching courses:', error);
        }
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim() && searchResults.length > 0) {
      // Navigate to the first result
      router.push(`/courses/${searchResults[0].course_code}`);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all session-related data from localStorage
      localStorage.removeItem('sessionStartTime')
      localStorage.removeItem('lastActivity')
      
      // Sign out through Supabase
      await signOut()
      
      // Force redirect to login page even if signOut fails
      router.push('/landing')
    } catch (error) {
      console.error('Error logging out:', error)
      // Ensure we still redirect on error
      router.push('/landing')
    }
  }

  const toggleCompactMode = () => {
    setIsCompactMode(prev => !prev)
  }

  // Open sidebar with smooth animation sequence
  // This function handles the entire opening animation flow
  const openSidebar = () => {
    setIsSidebarOpen(true)      // First add sidebar to DOM
    setIsSidebarClosing(false)  // Ensure we're not in closing state
    // Ensure DOM has time to mount the sidebar before animating
    // Double requestAnimationFrame ensures browser has fully rendered the sidebar
    // This prevents animation glitches and ensures smooth transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSidebarMounted(true)   // This triggers the entrance animations
        setIsBackdropActive(true)   // Fade in the backdrop
      })
    })
  }

  // Close sidebar with exit animations
  // This triggers the closing animations before the sidebar is removed from DOM
  // The actual removal happens in the transitionend event handler
  const closeSidebar = () => {
    setIsSidebarClosing(true)    // Start closing animation
    setIsSidebarMounted(false)   // Stop showing menu items
    setIsBackdropActive(false)   // Fade out backdrop
  }

  // Define all sidebar navigation menu items
  // Each item has category, label, icon and destination
  // Categories are used to group items in the sidebar
  const menuItems = [
    // Dashboard category
    { 
      category: 'dashboard',
      label: 'Home', 
      icon: <HomeIcon className="sidebar-icon animated-home-icon" />, 
      href: '/' 
    },
    {
      category: 'dashboard',
      label: 'Pomodoro Timer',
      icon: <ClockIcon className="sidebar-icon animated-icon animated-icon-rotate" />,
      href: '/pomodoro'
    },
    // Academic
    { label: 'Courses', href: '/courses', icon: <AcademicCapIcon className="sidebar-icon animated-icon animated-icon-bounce" />, category: 'academic' },
    { label: 'GPA Calculator', href: '/gpa-calculator', icon: <CalculatorIcon className="sidebar-icon animated-icon animated-icon-shake" />, category: 'academic' },
    { label: 'Academic Calendar', href: '/academic-calendar', icon: <CalendarIcon className="sidebar-icon animated-icon animated-icon-rotate" />, category: 'academic' },
    
    // Communication
    { label: 'Notifications', href: '/notifications', icon: <BellIcon className="sidebar-icon animated-notification-icon" />, category: 'communication' },
    { label: 'AI Chat', href: '/chat', icon: <ChatBubbleLeftRightIcon className="sidebar-icon animated-chat-icon" />, category: 'communication' },
    { label: 'Students', href: '/students', icon: <UserGroupIcon className="sidebar-icon animated-students-icon" />, category: 'communication' },
    
    // Career
    { label: 'Faculty', href: '/faculty', icon: <BuildingOfficeIcon className="sidebar-icon animated-icon animated-icon-pulse" />, category: 'career' },
    { label: 'Summer Training', href: '/summer-training', icon: <BriefcaseIcon className="sidebar-icon animated-icon animated-icon-float" />, category: 'career' },
    { label: 'Events', href: '/events', icon: <CalendarIcon className="sidebar-icon animated-icon animated-icon-rotate" />, category: 'career' },
    
    // Profile
    { label: 'Profile', href: '/profile', icon: <UserCircleIcon className="sidebar-icon animated-profile-icon" />, category: 'profile' },
    
    // Admin (conditional)
    ...(isAdmin ? [{ label: 'Admin', href: '/admin', icon: <ShieldCheckIcon className="sidebar-icon animated-admin-icon" />, category: 'admin' }] : []),
    
    // Logout
    { label: 'Logout', action: handleLogout, icon: <ArrowRightOnRectangleIcon className="sidebar-icon animated-logout-icon" />, category: 'logout' }
  ]

  // Add a useEffect to close sidebar when links are clicked
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleLinkClicks = (e: MouseEvent) => {
      // Find if the click is on a link inside the sidebar
      let target = e.target as Node;
      while (target && target !== document) {
        if ((target as HTMLElement).tagName === 'A' && sidebarRef.current?.contains(target as HTMLElement)) {
          closeSidebar();
          break;
        }
        target = (target as HTMLElement).parentNode as Node;
      }
    };

    document.addEventListener('click', handleLinkClicks);
    return () => {
      document.removeEventListener('click', handleLinkClicks);
    };
  }, [isSidebarOpen, closeSidebar]);

  return (
    <nav className="navbar">
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px #10b981); }
          50% { filter: drop-shadow(0 0 8px #10b981); }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-3px) translateX(1px); }
          100% { transform: translateY(0) translateX(0); }
        }

        @keyframes fadeInOut {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }

        @keyframes wobble {
          0%, 100% { transform: translateX(0) rotate(0); }
          15% { transform: translateX(-5px) rotate(-5deg); }
          30% { transform: translateX(4px) rotate(3deg); }
          45% { transform: translateX(-3px) rotate(-3deg); }
          60% { transform: translateX(2px) rotate(2deg); }
          75% { transform: translateX(-1px) rotate(-1deg); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes slideBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animated-icon {
          transition: all 0.3s ease;
        }
        
        .animated-icon-pulse:hover {
          animation: pulse 1s infinite;
        }
        
        .animated-icon-bounce:hover {
          animation: bounce 1s infinite;
        }
        
        .animated-icon-glow {
          animation: glow 2s infinite;
        }

        .animated-icon-rotate:hover {
          animation: rotate 2s infinite linear;
        }

        .animated-icon-shake:hover {
          animation: shake 0.5s infinite;
        }

        .animated-icon-float:hover {
          animation: float 2s infinite ease-in-out;
        }

        .animated-icon-fade:hover {
          animation: fadeInOut 1.5s infinite ease-in-out;
        }

        .animated-icon-wobble:hover {
          animation: wobble 1.5s infinite ease-in-out;
        }

        .animated-icon-blink:hover {
          animation: blink 1.5s infinite ease-in-out;
        }
        
        .animated-students-icon {
          animation: none;
          filter: none;
        }

        .animated-chat-icon {
          animation: none;
        }

        .animated-home-icon {
          animation: none;
        }

        .animated-notification-icon {
          animation: none;
        }

        .animated-logout-icon:hover {
          animation: none;
          color: #ef4444;
        }

        .animated-profile-icon {
          animation: none;
        }

        .animated-admin-icon {
          animation: none;
        }

        .animated-dashboard-icon {
          animation: none;
        }

        .animated-calendar-icon {
          animation: none;
        }

        .animated-academic-icon {
          animation: none;
        }

        .animated-faculty-icon {
          animation: none;
        }

        .animated-training-icon {
          animation: none;
        }

        .animated-events-icon {
          animation: none;
        }

        .animated-toggle-icon:hover {
          animation: none;
          transform-origin: center;
        }

        .animated-search-icon {
          animation: none;
        }

        .category-label {
          position: relative;
          overflow: hidden;
        }

        .category-label::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(16,185,129,0.2), rgba(16,185,129,0.8), rgba(16,185,129,0.2));
          background-size: 200% 100%;
          animation: slideBg 2s infinite;
        }

        @keyframes chatPulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 5px #10b981); }
          100% { transform: scale(1); opacity: 0.8; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="nav-content">
        {/* Title on the left */}
        <div className="nav-left">
          {showBack && (
            <button 
              onClick={() => router.back()}
              className="back-button mr-4"
              aria-label="Go back"
            >
              Back
            </button>
          )}
          <Link href="/" className="flex items-center">
            <h1 className="mx-2 flex items-center text-xl font-bold">
              <span className="text-emerald-500 mr-0.5 text-[1.7rem] font-extrabold drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">#</span>
              <span className="title-text">Student_Hub</span>
            </h1>
          </Link>
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
                    <MagnifyingGlassIcon className="h-5 w-5 animated-search-icon" />
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
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="logout-button"
              aria-label="Logout"
              title="Logout"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLogout();
                }
              }}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 animated-logout-icon" />
            </button>
            {studentProfile?.avatar_url ? (
              <div 
                className="profile-avatar-wrapper"
                onClick={() => router.push('/profile')}
                tabIndex={0}
                role="button"
                aria-label="View your profile"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push('/profile');
                  }
                }}
              >
                <Image 
                  src={studentProfile.avatar_url} 
                  alt={`${studentProfile.full_name || 'User'}'s profile`}
                  width={40} 
                  height={40}
                  className="profile-avatar-image animated-profile-icon" 
                  priority
                />
              </div>
            ) : (
              <div 
                className="profile-avatar-fallback"
                onClick={() => router.push('/profile')}
                tabIndex={0}
                role="button"
                aria-label="View your profile"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push('/profile');
                  }
                }}
              >
                <UserCircleIcon className="h-6 w-6 animated-profile-icon" />
              </div>
            )}
            <button
              onClick={openSidebar}
              className="sidebar-toggle-button"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6 animated-toggle-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar backdrop */}
      {(isSidebarOpen || isSidebarClosing) && (
        <div 
          className={`sidebar-backdrop ${isBackdropActive ? 'sidebar-backdrop-active' : ''} ${isSidebarClosing ? 'sidebar-backdrop-closing' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {(isSidebarOpen || isSidebarClosing) && (
        <div 
          ref={sidebarRef}
          // Apply different classes based on sidebar state for animations
          // sidebar-enter: Initial position (off-screen)
          // sidebar-enter-active: Animated entrance
          // sidebar-closing: Exit animation
          // sidebar-compact: Narrow width mode
          className={`sidebar ${!isSidebarMounted ? 'sidebar-enter' : 'sidebar-enter-active'} ${isSidebarClosing ? 'sidebar-closing' : ''} ${isCompactMode ? 'sidebar-compact' : ''}`}
        >
          <div className="sidebar-header">
            <h2 className="sidebar-title">Menu</h2>
            <div className="sidebar-actions">
              <ThemeToggle />
              <button 
                onClick={toggleCompactMode}
                className="sidebar-compact-toggle"
                aria-label={isCompactMode ? "Expand sidebar" : "Collapse sidebar"}
                title={isCompactMode ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCompactMode ? (
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                )}
              </button>
              <button 
                onClick={closeSidebar}
                className="sidebar-close-button"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div 
            className="sidebar-content"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Mobile search bar - only visible on mobile devices */}
            <div className="mobile-search-container" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSearch(e);
              }} className="mobile-search-form">
                <div className="mobile-search-input-container">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mobile-search-input"
                    onFocus={(e) => {
                      e.stopPropagation();
                      if (searchResults.length > 0) {
                        setShowResults(true)
                      }
                    }}
                  />
                  {isSearching ? (
                    <div className="search-loading"></div>
                  ) : (
                    <button 
                      type="submit" 
                      className="mobile-search-button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </form>
              
              {/* Mobile Search Results */}
              {showResults && (
                <div className="mobile-search-results" onClick={(e) => e.stopPropagation()}>
                  {searchResults.length === 0 ? (
                    <div className="mobile-no-results">No courses found</div>
                  ) : (
                    <ul className="mobile-results-list">
                      {searchResults.map((result) => (
                        <li key={result.course_code} className="mobile-result-item">
                          <div
                            className="mobile-result-link w-full text-left block"
                            style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                            onClick={() => {
                              // Close sidebar and immediately navigate
                              closeSidebar();
                              
                              // Most direct way to navigate
                              window.location.replace(`/courses/${result.course_code}`);
                            }}
                          >
                            <span className="mobile-result-code">{result.course_code}</span>
                            <span className="mobile-result-name">{result.course_name}</span>
                            <span className="mobile-result-faculty">{result.faculty.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Dashboard */}
            <div className="menu-category">
              <div className="category-divider">
                <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Dashboard</span>
              </div>
              <ul className="sidebar-menu">
                {menuItems
                  .filter(item => item.category === 'dashboard')
                  .map((item) => (
                    <li 
                      key={item.label} 
                      className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                    >
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => closeSidebar()}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent event bubbling
                            closeSidebar(); 
                            if (item.action) item.action(); 
                          }}
                          className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Academic */}
            <div className="menu-category">
              <div className="category-divider">
                <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Academic</span>
              </div>
              <ul className="sidebar-menu">
                {menuItems
                  .filter(item => item.category === 'academic')
                  .map((item) => (
                    <li 
                      key={item.label} 
                      className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                    >
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => closeSidebar()}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent event bubbling
                            closeSidebar(); 
                            if (item.action) item.action(); 
                          }}
                          className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Communication */}
            <div className="menu-category">
              <div className="category-divider">
                <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Communication</span>
              </div>
              <ul className="sidebar-menu">
                {menuItems
                  .filter(item => item.category === 'communication')
                  .map((item) => (
                    <li 
                      key={item.label} 
                      className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                    >
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => closeSidebar()}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent event bubbling
                            closeSidebar(); 
                            if (item.action) item.action(); 
                          }}
                          className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Career */}
            <div className="menu-category">
              <div className="category-divider">
                <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Career</span>
              </div>
              <ul className="sidebar-menu">
                {menuItems
                  .filter(item => item.category === 'career')
                  .map((item) => (
                    <li 
                      key={item.label} 
                      className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                    >
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => closeSidebar()}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent event bubbling
                            closeSidebar(); 
                            if (item.action) item.action(); 
                          }}
                          className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Profile */}
            <div className="menu-category">
              <div className="category-divider">
                <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Profile</span>
              </div>
              <ul className="sidebar-menu">
                {menuItems
                  .filter(item => item.category === 'profile')
                  .map((item) => (
                    <li 
                      key={item.label} 
                      className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                    >
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => closeSidebar()}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent event bubbling
                            closeSidebar(); 
                            if (item.action) item.action(); 
                          }}
                          className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                          title={isCompactMode ? item.label : undefined}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.icon}
                          <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Admin (conditional) */}
            {isAdmin && (
              <div className="menu-category">
                <div className="category-divider">
                  <span className={`category-label ${isCompactMode ? 'category-label-hidden' : ''}`}>Admin</span>
                </div>
                <ul className="sidebar-menu">
                  {menuItems
                    .filter(item => item.category === 'admin')
                    .map((item) => (
                      <li 
                        key={item.label} 
                        className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                      >
                        {item.href ? (
                          <a 
                            href={item.href}
                            className={`menu-link w-full text-left ${isCompactMode ? 'menu-link-compact' : ''}`}
                            title={isCompactMode ? item.label : undefined}
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => closeSidebar()}
                          >
                            {item.icon}
                            <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                          </a>
                        ) : (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); // Prevent event bubbling
                              closeSidebar(); 
                              if (item.action) item.action(); 
                            }}
                            className={`menu-link ${isCompactMode ? 'menu-link-compact' : ''}`}
                            title={isCompactMode ? item.label : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.icon}
                            <span className={`menu-label ${isCompactMode ? 'menu-label-hidden' : ''}`}>{item.label}</span>
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}