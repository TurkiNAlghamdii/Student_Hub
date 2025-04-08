'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  CalendarIcon
} from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar/Navbar'
import './academic-calendar.css'

interface CalendarData {
  id: string
  file_name: string
  file_size: number
  file_url: string
  description: string | null
  uploaded_at: string
  semester: string
  active: boolean
}

export default function AcademicCalendarPage() {
  const [activeCalendar, setActiveCalendar] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfHeight, setPdfHeight] = useState('calc(100vh - 300px)')

  useEffect(() => {
    fetchCalendars()

    // Adjust PDF height based on window size
    const updatePdfHeight = () => {
      setPdfHeight(`calc(100vh - 300px)`)
    }
    
    window.addEventListener('resize', updatePdfHeight)
    return () => window.removeEventListener('resize', updatePdfHeight)
  }, [])

  const fetchCalendars = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch the active calendar first
      const { data, error: fetchError } = await supabase
        .from('academic_calendars')
        .select('*')
        .eq('active', true)
        .order('uploaded_at', { ascending: false })
        .limit(1)
      
      if (fetchError) throw fetchError
      
      // If there's an active calendar, use it
      if (data && data.length > 0) {
        setActiveCalendar(data[0] as CalendarData)
      } else {
        // If no active calendar, get the most recent one
        const { data: recentData, error: recentError } = await supabase
          .from('academic_calendars')
          .select('*')
          .order('uploaded_at', { ascending: false })
          .limit(1)
        
        if (recentError) throw recentError
        
        if (recentData && recentData.length > 0) {
          setActiveCalendar(recentData[0] as CalendarData)
        } else {
          setActiveCalendar(null)
        }
      }
    } catch (err) {
      setError('Failed to load academic calendar. Please try again later.')
      console.error('Error fetching calendars:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 home-container">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="welcome-section bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden">
            <div className="welcome-container relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon bg-emerald-500/10 rounded-full p-3 flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Academic Calendar</h1>
                  <p className="text-gray-400 text-sm mt-1">View and download the KAU academic calendar</p>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-6 py-4 rounded-2xl">
              <p>{error}</p>
            </div>
          ) : (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
              {activeCalendar ? (
                <div className="pdf-container">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-emerald-400 mr-2" />
                      <span className="text-white font-medium">
                        {activeCalendar.semester} Academic Calendar
                      </span>
                      {activeCalendar.description && (
                        <span className="ml-3 text-sm text-gray-400">
                          {activeCalendar.description}
                        </span>
                      )}
                    </div>
                    
                    <a
                      href={activeCalendar.file_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                  
                  <iframe
                    src={`${activeCalendar.file_url}#toolbar=0&navpanes=0`}
                    className="w-full border-0"
                    style={{ height: pdfHeight }}
                    title={`${activeCalendar.semester} Academic Calendar`}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                  <CalendarIcon className="h-16 w-16 text-gray-700 mb-4" />
                  <h3 className="text-xl font-medium text-gray-300 mb-2">No Academic Calendar Available</h3>
                  <p className="text-gray-500">
                    There is currently no academic calendar uploaded. Please check back later.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
} 