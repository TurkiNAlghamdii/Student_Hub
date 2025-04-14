'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  CalendarIcon,
  DocumentIcon
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

interface ExamCalendarData {
  id: string
  title: string
  url: string
  exam_type: 'Mid Term' | 'Final'
  semester: string
  description: string
  created_at: string
}

export default function AcademicCalendarPage() {
  const [activeTab, setActiveTab] = useState<'academic' | 'exam'>('academic')
  const [activeCalendar, setActiveCalendar] = useState<CalendarData | null>(null)
  const [examCalendars, setExamCalendars] = useState<ExamCalendarData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExams, setLoadingExams] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examError, setExamError] = useState<string | null>(null)
  const [pdfHeight, setPdfHeight] = useState('calc(100vh - 300px)')

  useEffect(() => {
    fetchCalendars()
    fetchExamCalendars()

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

  const fetchExamCalendars = async () => {
    try {
      setLoadingExams(true)
      setExamError(null)
      
      const { data, error } = await supabase
        .from('exam_calendars')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setExamCalendars(data || [])
    } catch (err) {
      setExamError('Failed to load exam calendars. Please try again later.')
      console.error('Error fetching exam calendars:', err)
    } finally {
      setLoadingExams(false)
    }
  }

  return (
    <div className="home-container">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="welcome-section p-6 relative">
            <div className="welcome-container relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon rounded-full p-3 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-500/20">
                  <CalendarIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academic Calendar</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">View and download academic and exam calendars</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-b dark:border-gray-800 border-gray-200">
            <ul className="flex space-x-2">
              <li>
                <button 
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`py-3 px-6 rounded-t-lg transition-all duration-200 font-medium ${
                    activeTab === 'academic' 
                      ? 'dark:text-white text-gray-800 border-b-2 border-emerald-500 dark:border-emerald-400 dark:bg-gray-800/50 bg-gray-100/80' 
                      : 'dark:text-gray-400 text-gray-500 dark:hover:text-gray-200 hover:text-gray-700 dark:hover:bg-gray-800/30 hover:bg-gray-100/50'
                  }`}
                >
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>Academic Calendar</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => setActiveTab('exam')}
                  className={`py-3 px-6 rounded-t-lg transition-all duration-200 font-medium ${
                    activeTab === 'exam' 
                      ? 'dark:text-white text-gray-800 border-b-2 border-emerald-500 dark:border-emerald-400 dark:bg-gray-800/50 bg-gray-100/80' 
                      : 'dark:text-gray-400 text-gray-500 dark:hover:text-gray-200 hover:text-gray-700 dark:hover:bg-gray-800/30 hover:bg-gray-100/50'
                  }`}
                >
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 mr-2" />
                    <span>Exam Calendar</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
          
          {activeTab === 'academic' ? (
            loading ? (
              <div className="flex items-center justify-center h-64 dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl p-6 dark:border-gray-800/50 border border-gray-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
              </div>
            ) : error ? (
              <div className="dark:bg-red-900/20 bg-red-50 dark:border-red-800 border border-red-200 dark:text-red-400 text-red-600 px-6 py-4 rounded-2xl">
                <p>{error}</p>
              </div>
            ) : (
              <div className="dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl dark:border-gray-800/50 border border-gray-200 overflow-hidden">
                {activeCalendar ? (
                  <div className="pdf-container">
                    <div className="p-4 dark:border-gray-800 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 dark:text-emerald-400 text-emerald-600 mr-2" />
                        <span className="dark:text-white text-gray-800 font-medium">
                          {activeCalendar.semester} Academic Calendar
                        </span>
                        {activeCalendar.description && (
                          <span className="ml-3 text-sm dark:text-gray-400 text-gray-500">
                            {activeCalendar.description}
                          </span>
                        )}
                      </div>
                      
                      <a 
                        href={activeCalendar.file_url} 
                        download
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1.5 dark:bg-emerald-500/10 bg-emerald-100 dark:text-emerald-400 text-emerald-600 rounded-lg dark:hover:bg-emerald-500/20 hover:bg-emerald-200 transition-colors text-sm"
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
                    <CalendarIcon className="h-16 w-16 dark:text-gray-700 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium dark:text-gray-300 text-gray-600 mb-2">No Academic Calendar Available</h3>
                    <p className="dark:text-gray-500 text-gray-500">
                      There is currently no academic calendar uploaded. Please check back later.
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            loadingExams ? (
              <div className="flex items-center justify-center h-64 dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl p-6 dark:border-gray-800/50 border border-gray-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
              </div>
            ) : examError ? (
              <div className="dark:bg-red-900/20 bg-red-50 dark:border-red-800 border border-red-200 dark:text-red-400 text-red-600 px-6 py-4 rounded-2xl">
                <p>{examError}</p>
              </div>
            ) : examCalendars.length === 0 ? (
              <div className="dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl p-6 dark:border-gray-800/50 border border-gray-200 text-center">
                <p className="dark:text-gray-400 text-gray-500">No exam calendars available at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examCalendars.map(calendar => (
                  <div 
                    key={calendar.id} 
                    className="dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-xl p-4 dark:border-gray-800/50 border border-gray-200 dark:hover:border-emerald-800/50 hover:border-emerald-300 transition-all hover:shadow-lg dark:hover:shadow-emerald-900/10 hover:shadow-emerald-100/50 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${calendar.exam_type === 'Mid Term' ? 'dark:bg-blue-900/30 bg-blue-100 dark:text-blue-400 text-blue-700' : 'dark:bg-purple-900/30 bg-purple-100 dark:text-purple-400 text-purple-700'}`}>
                          {calendar.exam_type}
                        </span>
                      </div>
                      <span className="dark:text-gray-500 text-gray-400 text-xs">
                        {new Date(calendar.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="dark:text-white text-gray-800 font-medium mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {calendar.title}
                    </h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm mb-4 line-clamp-2">
                      {calendar.description}
                    </p>
                    <a 
                      href={calendar.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full dark:bg-gray-800 bg-gray-100 dark:hover:bg-gray-700 hover:bg-gray-200 dark:text-white text-gray-800 px-3 py-2 rounded text-sm font-medium transition-colors group-hover:bg-emerald-600 group-hover:text-white"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download Calendar
                    </a>
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </main>
    </div>
  )
} 