'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UsersIcon, ArrowTrendingUpIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import { motion } from 'framer-motion'

export default function StudentCountWidget() {
  const [studentCount, setStudentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [growthRate, setGrowthRate] = useState<number>(0)

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })

        if (error) throw error

        setStudentCount(count || 0)
        
        // Simulate growth rate (in a real app, you'd calculate this from historical data)
        setGrowthRate(Math.floor(Math.random() * 15) + 5) // Random growth between 5-20%
      } catch (err) {
        console.error('Error fetching student count:', err)
        setError('Failed to fetch student count')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentCount()
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
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden h-full hover:border-emerald-500/20 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-emerald-500/10 rounded-full p-2 mr-2">
              <UsersIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Student Population</h3>
          </div>
          <div className="flex items-center bg-emerald-500/10 px-2 py-1 rounded-full">
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-xs text-emerald-400">+{growthRate}%</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center">
          <motion.h3 
            className="text-4xl font-bold text-white mb-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {studentCount.toLocaleString()}
          </motion.h3>
          <p className="text-gray-400 text-sm font-medium mb-4">Registered Students</p>
          
          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden mb-4">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500/70 to-emerald-400/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1 }}
            ></motion.div>
          </div>
          
          <div className="flex items-center justify-center text-xs text-gray-400">
            <AcademicCapIcon className="w-4 h-4 mr-1" />
            <span>Active students across all departments</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 