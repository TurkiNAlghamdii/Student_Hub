'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'

export default function EventsPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Navbar title="Events" />
      <div className="container mx-auto p-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-800/50">
          <h1 className="text-2xl font-bold mb-6 text-white">Events</h1>
          {/* Add your events content here */}
        </div>
      </div>
    </div>
  )
}