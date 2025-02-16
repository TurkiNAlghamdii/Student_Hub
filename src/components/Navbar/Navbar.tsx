'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import './Navbar.css'

interface NavbarProps {
  title: string
  showProfile?: boolean
  showBack?: boolean
}

export default function Navbar({ title, showProfile = false, showBack = false }: NavbarProps) {
  const router = useRouter()

  return (
    <nav className="navbar">
      <div className="nav-content">
        <h1 className="nav-title">{title}</h1>
        <div className="nav-buttons">
          {showBack && (
            <button 
              className="back-button"
              onClick={() => router.push('/')}
            >
              Back to Home
            </button>
          )}
          {showProfile && (
            <button 
              className="profile-button"
              onClick={() => router.push('/profile')}
            >
              Profile
            </button>
          )}
          <button 
            className="logout-button"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
} 