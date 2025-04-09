'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  DocumentIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface CalendarData {
  id: string
  file_name: string
  file_size: number
  file_type: string
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

export default function AcademicCalendarManagement() {
  // Academic Calendar States
  const [calendars, setCalendars] = useState<CalendarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [deletingCalendar, setDeletingCalendar] = useState<string | null>(null)
  const [semester, setSemester] = useState('')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Exam Calendar States
  const [activeTab, setActiveTab] = useState<'academic' | 'exam'>('academic')
  const [examCalendars, setExamCalendars] = useState<ExamCalendarData[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [examError, setExamError] = useState<string | null>(null)
  const [examTitle, setExamTitle] = useState('')
  const [examUrl, setExamUrl] = useState('')
  const [examSemester, setExamSemester] = useState('')
  const [examType, setExamType] = useState<'Mid Term' | 'Final'>('Mid Term')
  const [examDescription, setExamDescription] = useState('')
  const [isAddingExam, setIsAddingExam] = useState(false)
  const [examSuccess, setExamSuccess] = useState<string | null>(null)
  const [deletingExamCalendar, setDeletingExamCalendar] = useState<string | null>(null)

  // Fetch all calendars
  useEffect(() => {
    fetchCalendars()
    fetchExamCalendars()
  }, [])

  const fetchCalendars = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('academic_calendars')
        .select('*')
        .order('uploaded_at', { ascending: false })
      
      if (error) throw error
      
      setCalendars(data || [])
    } catch (error) {
      setError('Failed to fetch academic calendars')
    } finally {
      setLoading(false)
    }
  }

  const fetchExamCalendars = async () => {
    try {
      setLoadingExams(true)
      const { data, error } = await supabase
        .from('exam_calendars')
        .select('*')
        .order('uploaded_at', { ascending: false })
      
      if (error) throw error
      
      setExamCalendars(data || [])
    } catch (error) {
      setExamError('Failed to fetch exam calendars')
    } finally {
      setLoadingExams(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed')
        setSelectedFile(null)
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit')
        setSelectedFile(null)
        return
      }
      
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setUploadError('Please select a PDF file')
      return
    }
    
    if (!semester.trim()) {
      setUploadError('Please enter the semester information')
      return
    }
    
    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(10)
      
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Must be logged in as admin')
      }
      
      // Generate filename
      const fileName = `calendar-${Date.now()}.pdf`
      const filePath = `academic-calendars/${fileName}`
      
      // Upload file
      setUploadProgress(30)
      const { error: uploadError } = await supabase
        .storage
        .from('academic-files')
        .upload(filePath, selectedFile, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })
      
      if (uploadError) throw uploadError
      
      setUploadProgress(60)
      
      // Get public URL
      const { data } = supabase
        .storage
        .from('academic-files')
        .getPublicUrl(filePath)
      
      // Save to database
      setUploadProgress(80)
      
      const { error: dbError } = await supabase
        .from('academic_calendars')
        .insert([{
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          file_url: data.publicUrl,
          description: description,
          semester: semester,
          active: true,
          uploaded_by: user.id
        }])
      
      if (dbError) throw dbError
      
      setUploadProgress(100)
      setUploadSuccess('Calendar uploaded successfully!')
      
      // Reset form
      setSelectedFile(null)
      setSemester('')
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh calendars
      fetchCalendars()
      
      setTimeout(() => setUploadSuccess(null), 5000)
    } catch (err) {
      setUploadError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCalendar = async (calendarId: string, filePath: string) => {
    if (!window.confirm('Are you sure you want to delete this calendar?')) {
      return
    }
    
    try {
      setDeletingCalendar(calendarId)
      
      // Extract storage path
      const urlParts = filePath.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Delete from storage
      await supabase
        .storage
        .from('academic-files')
        .remove([`academic-calendars/${fileName}`])
      
      // Delete from database
      await supabase
        .from('academic_calendars')
        .delete()
        .eq('id', calendarId)
      
      // Refresh calendars
      setCalendars(calendars.filter(cal => cal.id !== calendarId))
    } catch (err) {
      setError('Failed to delete calendar')
    } finally {
      setDeletingCalendar(null)
    }
  }

  const handleAddExamCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examTitle || !examUrl || !examSemester) {
      setExamError('Please fill all required fields')
      return
    }
    
    try {
      setIsAddingExam(true)
      setExamError(null)
      
      const { error } = await supabase
        .from('exam_calendars')
        .insert([
          {
            title: examTitle,
            url: examUrl,
            exam_type: examType,
            semester: examSemester,
            description: examDescription
          }
        ])
      
      if (error) throw error
      
      setExamSuccess('Exam calendar added successfully!')
      
      // Reset form
      setExamTitle('')
      setExamUrl('')
      setExamSemester('')
      setExamDescription('')
      
      // Refresh calendars
      fetchExamCalendars()
      
      setTimeout(() => setExamSuccess(null), 3000)
    } catch (error) {
      setExamError('Failed to add exam calendar')
    } finally {
      setIsAddingExam(false)
    }
  }

  const handleDeleteExamCalendar = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam calendar?')) {
      return
    }
    
    try {
      setDeletingExamCalendar(id)
      
      const { error } = await supabase
        .from('exam_calendars')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Refresh calendars
      fetchExamCalendars()
    } catch (error) {
      setExamError('Failed to delete exam calendar')
    } finally {
      setDeletingExamCalendar(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl" style={{ position: 'relative', zIndex: 0 }}>
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center">
        <CalendarIcon className="w-8 h-8 mr-3 text-emerald-400" />
        Academic Calendar Management
      </h1>
      
      <div className="mb-8 border-b border-gray-700" style={{ position: 'relative', zIndex: 1 }}>
        <ul className="flex space-x-2">
          <li style={{ position: 'relative', zIndex: 2 }}>
            <button 
              type="button"
              onClick={() => setActiveTab('academic')}
              style={{ cursor: 'pointer' }}
              className={`py-3 px-6 rounded-t-lg transition-all duration-200 font-medium ${
                activeTab === 'academic' 
                  ? 'text-white border-b-2 border-emerald-400 bg-gray-800' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                <span>Academic Calendar</span>
              </div>
            </button>
          </li>
          <li style={{ position: 'relative', zIndex: 2 }}>
            <button 
              type="button"
              onClick={() => setActiveTab('exam')}
              style={{ cursor: 'pointer' }}
              className={`py-3 px-6 rounded-t-lg transition-all duration-200 font-medium ${
                activeTab === 'exam' 
                  ? 'text-white border-b-2 border-emerald-400 bg-gray-800' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                <span>Exam Calendar</span>
              </div>
            </button>
          </li>
        </ul>
      </div>
      
      {activeTab === 'academic' ? (
        <>
          <div className="mb-8 p-6 bg-gray-800/80 rounded-xl shadow-lg border border-gray-700" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center mb-6">
              <CloudArrowUpIcon className="w-6 h-6 text-emerald-400 mr-3" />
              <h2 className="text-xl font-medium text-white">Upload Academic Calendar</h2>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-5">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="e.g., Fall 2023"
                  style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                />
              </div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  rows={3}
                  placeholder="Brief description of this calendar"
                  style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                ></textarea>
              </div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">File (PDF only)</label>
                <div className="flex items-center w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer transition-all"
                    accept=".pdf"
                    style={{ cursor: 'pointer', position: 'relative', zIndex: 3 }}
                  />
                </div>
              </div>
              
              {uploadError && (
                <div className="p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </div>
              )}
              
              {uploadSuccess && (
                <div className="p-3 bg-emerald-900/50 text-emerald-300 rounded-lg border border-emerald-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {uploadSuccess}
                </div>
              )}
              
              {isUploading && (
                <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isUploading}
                className="mt-2 w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    <span>Upload Calendar</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-gray-800/80 rounded-xl shadow-lg border border-gray-700" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center mb-6">
              <DocumentIcon className="w-6 h-6 text-emerald-400 mr-3" />
              <h2 className="text-xl font-medium text-white">Academic Calendars</h2>
            </div>
            
            {error && (
              <div className="p-3 mb-6 bg-red-900/50 text-red-300 rounded-lg border border-red-800">
                {error}
              </div>
            )}
            
            {calendars.length === 0 ? (
              <div className="bg-gray-700/50 text-gray-400 text-center p-8 rounded-lg border border-gray-600 flex flex-col items-center">
                <CalendarIcon className="w-12 h-12 mb-3 text-gray-500" />
                <p>No calendars available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-300 font-medium">Semester</th>
                      <th className="text-left p-3 text-gray-300 font-medium">File</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Date</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {calendars.map(calendar => (
                      <tr key={calendar.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="p-3 text-gray-300">{calendar.semester}</td>
                        <td className="p-3">
                          <a 
                            href={calendar.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-400 hover:underline flex items-center"
                            style={{ position: 'relative', zIndex: 2 }}
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            {calendar.file_name}
                          </a>
                        </td>
                        <td className="p-3 text-gray-300">
                          {new Date(calendar.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteCalendar(calendar.id, calendar.file_url)}
                            disabled={deletingCalendar === calendar.id}
                            className="text-red-400 hover:text-red-300 flex items-center transition-colors"
                            style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}
                          >
                            {deletingCalendar === calendar.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2"></div>
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-4 h-4 mr-1" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-8 p-6 bg-gray-800/80 rounded-xl shadow-lg border border-gray-700" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center mb-6">
              <CloudArrowUpIcon className="w-6 h-6 text-emerald-400 mr-3" />
              <h2 className="text-xl font-medium text-white">Add Exam Calendar</h2>
            </div>
            
            <form onSubmit={handleAddExamCalendar} className="space-y-5">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="e.g., Midterm Exam Schedule"
                  style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                />
              </div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                <input
                  type="url"
                  value={examUrl}
                  onChange={(e) => setExamUrl(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="https://example.com/exam-calendar.pdf"
                  style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as 'Mid Term' | 'Final')}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    style={{ cursor: 'pointer', position: 'relative', zIndex: 3 }}
                  >
                    <option value="Mid Term">Mid Term</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
                
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Semester</label>
                  <input
                    type="text"
                    value={examSemester}
                    onChange={(e) => setExamSemester(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="e.g., Fall 2023"
                    style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                  />
                </div>
              </div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  rows={3}
                  placeholder="Brief description of this exam calendar"
                  style={{ cursor: 'text', position: 'relative', zIndex: 3 }}
                ></textarea>
              </div>
              
              {examError && (
                <div className="p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {examError}
                </div>
              )}
              
              {examSuccess && (
                <div className="p-3 bg-emerald-900/50 text-emerald-300 rounded-lg border border-emerald-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {examSuccess}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isAddingExam}
                className="mt-2 w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}
              >
                {isAddingExam ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    <span>Add Exam Calendar</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-gray-800/80 rounded-xl shadow-lg border border-gray-700" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center mb-6">
              <DocumentIcon className="w-6 h-6 text-emerald-400 mr-3" />
              <h2 className="text-xl font-medium text-white">Exam Calendars</h2>
            </div>
            
            {examError && (
              <div className="p-3 mb-6 bg-red-900/50 text-red-300 rounded-lg border border-red-800">
                {examError}
              </div>
            )}
            
            {examCalendars.length === 0 ? (
              <div className="bg-gray-700/50 text-gray-400 text-center p-8 rounded-lg border border-gray-600 flex flex-col items-center">
                <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-500" />
                <p>No exam calendars available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-300 font-medium">Title</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Type</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Semester</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Date</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {examCalendars.map(calendar => (
                      <tr key={calendar.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="p-3">
                          <a 
                            href={calendar.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-400 hover:underline flex items-center"
                            style={{ position: 'relative', zIndex: 2 }}
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            {calendar.title}
                          </a>
                        </td>
                        <td className="p-3 text-gray-300">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            calendar.exam_type === 'Mid Term' 
                              ? 'bg-blue-900/50 text-blue-300' 
                              : 'bg-amber-900/50 text-amber-300'
                          }`}>
                            {calendar.exam_type}
                          </span>
                        </td>
                        <td className="p-3 text-gray-300">{calendar.semester}</td>
                        <td className="p-3 text-gray-300">
                          {new Date(calendar.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteExamCalendar(calendar.id)}
                            disabled={deletingExamCalendar === calendar.id}
                            className="text-red-400 hover:text-red-300 flex items-center transition-colors"
                            style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}
                          >
                            {deletingExamCalendar === calendar.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2"></div>
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-4 h-4 mr-1" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 