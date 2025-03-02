'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import './Navbar.css'

interface NavbarProps {
  title: string
  showBack?: boolean
}

export default function Navbar({ title, showBack = false }: NavbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    console.log('Searching for:', searchQuery)
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
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
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
