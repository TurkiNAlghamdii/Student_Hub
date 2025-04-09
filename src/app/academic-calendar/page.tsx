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
                  <p className="text-gray-400 text-sm mt-1">View and download academic and exam calendars</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-b border-gray-800">
            <ul className="flex space-x-2">
              <li>
                <button 
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`py-3 px-6 rounded-t-lg transition-all duration-200 font-medium ${
                    activeTab === 'academic' 
                      ? 'text-white border-b-2 border-emerald-400 bg-gray-800/50' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
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
                      ? 'text-white border-b-2 border-emerald-400 bg-gray-800/50' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
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
            )
          ) : (
            loadingExams ? (
              <div className="flex items-center justify-center h-64 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
              </div>
            ) : examError ? (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-6 py-4 rounded-2xl">
                <p>{examError}</p>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                {examCalendars.length > 0 ? (
                  <div className="divide-y divide-gray-800">
                    {examCalendars.map((calendar) => (
                      <div key={calendar.id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            calendar.exam_type === 'Mid Term' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            <DocumentTextIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{calendar.title}</h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                calendar.exam_type === 'Mid Term'
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : 'bg-amber-900/50 text-amber-300'
                              }`}>
                                {calendar.exam_type}
                              </span>
                              <span className="text-sm text-gray-400">{calendar.semester}</span>
                              {calendar.description && (
                                <span className="text-sm text-gray-500">{calendar.description}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <a
                          href={calendar.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm ml-4"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          View Calendar
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                    <DocumentIcon className="h-16 w-16 text-gray-700 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">No Exam Calendars Available</h3>
                    <p className="text-gray-500">
                      There are currently no exam calendars available. Please check back later.
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </motion.div>
      </main>
    </div>
  )
} 