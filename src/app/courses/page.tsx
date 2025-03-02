'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'

export default function CoursesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Navbar title="My Courses" />
      <div className="container mx-auto p-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-800/50">
          <h1 className="text-2xl font-bold mb-6 text-white">My Courses</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div 
              className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800/50 p-6 cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={() => router.push('/courses/CPIT370')}
            >
              <h2 className="text-xl font-semibold text-emerald-500">CPIT370</h2>
              <p className="text-gray-300 mt-2">Computer Networks</p>
              <p className="text-gray-400 text-sm mt-1">Dr. Mohammed Ahmed</p>
            </div>
            {/* Add more course cards here */}
          </div>
        </div>
      </div>
    </div>
  )
}