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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import './Navbar.css'
import SearchResults from '../SearchResults/SearchResults'
import '../SearchResults/SearchResults.css'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface NavbarProps {
  showBack?: boolean
}

interface Course {
  course_code: string
  course_name: string
  faculty: {
    name: string
  }
}

interface StudentProfile {
  id: string
  full_name?: string
  avatar_url?: string
  // Other profile fields can be added as needed
}

export default function Navbar({ showBack = false }: NavbarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarClosing, setIsSidebarClosing] = useState(false)
  const [isSidebarMounted, setIsSidebarMounted] = useState(false)
  const [isBackdropActive, setIsBackdropActive] = useState(false)
  const [searchResults, setSearchResults] = useState<Course[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Fetch student profile including avatar
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;

      try {
        // First check if we have a cached avatar in localStorage
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        
        if (savedAvatar) {
          setStudentProfile({
            id: user.id,
            avatar_url: savedAvatar
          });
          return;
        }
        
        // If no cached avatar, fetch from database
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
          
          // Cache the avatar if available
          if (data.avatar_url) {
            localStorage.setItem(`avatar_${user.id}`, data.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };
    
    fetchStudentProfile();
  }, [user]);

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
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
      // Force reload as a fallback if the normal logout fails
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  }

  const openSidebar = () => {
    setIsSidebarOpen(true)
    setIsSidebarClosing(false)
    // Ensure DOM has time to mount the sidebar before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSidebarMounted(true)
        setIsBackdropActive(true)
      })
    })
  }

  const closeSidebar = () => {
    setIsSidebarClosing(true)
    setIsSidebarMounted(false)
    setIsBackdropActive(false)
  }

  // Menu items with staggered animation
  const menuItems = [
    { label: 'Home', href: '/', icon: <HomeIcon className="w-5 h-5" /> },
    { label: 'Profile', href: '/profile', icon: <UserCircleIcon className="w-5 h-5" /> },
    { label: 'Faculty', href: '/faculty', icon: <BuildingOfficeIcon className="w-5 h-5" /> },
    { label: 'Courses', href: '/courses', icon: <AcademicCapIcon className="w-5 h-5" /> },
    { label: 'GPA Calculator', href: '/gpa-calculator', icon: <CalculatorIcon className="w-5 h-5" /> },
    { label: 'Notifications', href: '/notifications', icon: <BellIcon className="w-5 h-5" /> },
    { label: 'Summer Training', href: '/summer-training', icon: <BriefcaseIcon className="w-5 h-5" /> },
    { label: 'Events', href: '/events', icon: <CalendarIcon className="w-5 h-5" /> },
    { label: 'AI Chat', href: '/chat', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { 
      label: isLoggingOut ? 'Logging out...' : 'Logout', 
      action: handleLogout, 
      icon: isLoggingOut ? 
        <div className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-emerald-500 animate-spin"></div> : 
        <ArrowRightOnRectangleIcon className="w-5 h-5" />,
      disabled: isLoggingOut
    }
  ]

  return (
    <nav className="navbar">
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
            <h1 className="text-xl font-bold text-white mx-2 hover:text-emerald-400 transition-colors">
              <span className="text-emerald-500">#</span>Student_Hub
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
                  className="profile-avatar-image" 
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
                <UserCircleIcon className="h-6 w-6" />
              </div>
            )}
            <button
              onClick={openSidebar}
              className="sidebar-toggle-button"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
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
          className={`sidebar ${!isSidebarMounted ? 'sidebar-enter' : 'sidebar-enter-active'} ${isSidebarClosing ? 'sidebar-closing' : ''}`}
        >
          <div className="sidebar-header">
            <h2 className="sidebar-title">Menu</h2>
            <button 
              onClick={closeSidebar}
              className="sidebar-close-button"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div 
            className="sidebar-content"
            style={{ overscrollBehavior: 'contain' }}
          >
            <ul className="sidebar-menu">
              {menuItems.map((item, index) => (
                <li 
                  key={item.label} 
                  className={`menu-item ${isSidebarMounted && !isSidebarClosing ? 'menu-item-visible' : ''}`}
                >
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      onClick={closeSidebar}
                      className="flex items-center gap-3"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button 
                      onClick={() => {
                        if (!item.disabled && item.action) {
                          item.action();
                        }
                        closeSidebar();
                      }}
                      className={`flex items-center gap-3 w-full text-left ${item.disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={item.disabled}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  )
}
