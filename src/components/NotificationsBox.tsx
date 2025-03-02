'use client'

import { useRouter } from 'next/navigation'

export default function NotificationsBox() {
  const router = useRouter()

  return (
    <div className="mt-6 p-6 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800/50">
      <h2 
        className="text-xl font-semibold text-white cursor-pointer hover:text-emerald-500 transition-colors"
        onClick={() => router.push('/notifications')}
      >
        Notifications
      </h2>
      <div className="mt-4 space-y-3">
        <div className="text-gray-300">
          New message in course{' '}
          <span 
            className="text-emerald-500 cursor-pointer hover:text-emerald-400 font-medium"
            onClick={() => router.push('/courses/CPIT370')}
          >
            CPIT370
          </span>
        </div>
      </div>
    </div>
  )
}