'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UsersIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import { motion } from 'framer-motion'
import './StudentCountWidget.css'

export default function StudentCountWidget() {
  const [studentCount, setStudentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })

        if (error) throw error

        setStudentCount(count || 0)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Error fetching student count:', err)
        setError('Failed to fetch student count')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentCount()
    
    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchStudentCount, 5 * 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden h-full">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden h-full">
        <div className="flex items-center justify-center h-32 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden h-full hover:border-emerald-500/20 transition-all duration-300 student-count-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 to-transparent rounded-2xl"></div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-300">Student Statistics</h3>
          <div className="bg-emerald-500/10 rounded-full p-2 student-count-icon">
            <UsersIcon className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center">
            <motion.h3 
              className="text-4xl font-bold mb-2 student-count-number"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.2
              }}
            >
              {studentCount.toLocaleString()}
            </motion.h3>
            <p className="text-gray-400 text-sm">Registered Students</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <span>Auto-refreshing</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 