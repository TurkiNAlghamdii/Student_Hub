'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  XMarkIcon
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

export default function AcademicCalendarManagement() {
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

  // Fetch all calendars
  useEffect(() => {
    fetchCalendars()
  }, [])

  const fetchCalendars = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('academic_calendars')
        .select('*')
        .order('uploaded_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      setCalendars(data as CalendarData[] || [])
    } catch (err) {
      setError('Failed to fetch academic calendars')
      console.error('Error fetching calendars:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed for academic calendars')
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

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a PDF file')
      return
    }
    
    if (!semester.trim()) {
      setUploadError('Please enter the semester information (e.g., Fall 2023)')
      return
    }
    
    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(10)
      
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in as an admin to upload calendars')
      }
      
      // Generate a unique filename
      const fileExtension = 'pdf'
      const fileName = `academic-calendar-${semester.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExtension}`
      const filePath = `academic-calendars/${fileName}`
      
      // Upload file to Supabase Storage
      setUploadProgress(30)
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('academic-files')
        .upload(filePath, selectedFile, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }
      
      setUploadProgress(60)
      
      // Get the public URL
      const { data } = supabase
        .storage
        .from('academic-files')
        .getPublicUrl(filePath)
      
      const publicUrl = data.publicUrl
      
      // Insert record into the database
      setUploadProgress(80)
      
      // First, check if we need to set previous calendars as inactive
      if (window.confirm('Set this as the active calendar? This will deactivate any previously active calendars.')) {
        // Update all existing calendars to inactive
        await supabase
          .from('academic_calendars')
          .update({ active: false })
          .eq('active', true)
      }
      
      const { error: dbError } = await supabase
        .from('academic_calendars')
        .insert([{
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          file_url: publicUrl,
          description: description,
          semester: semester,
          active: true, // Make the new calendar active by default
          uploaded_by: user.id
        }])
      
      if (dbError) {
        // Clean up storage if database insert fails
        await supabase
          .storage
          .from('academic-files')
          .remove([filePath])
          
        throw new Error('Failed to save calendar metadata')
      }
      
      setUploadProgress(100)
      setUploadSuccess('Academic calendar uploaded successfully!')
      
      // Reset form
      setSelectedFile(null)
      setSemester('')
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh the calendar list
      fetchCalendars()
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setUploadSuccess(null)
      }, 5000)
    } catch (err) {
      console.error('Error uploading calendar:', err)
      setUploadError(`${err instanceof Error ? err.message : 'An unexpected error occurred during upload'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      // First, make all calendars inactive
      await supabase
        .from('academic_calendars')
        .update({ active: false })
        .eq('active', true)
      
      // Then set the selected calendar as active
      const { error } = await supabase
        .from('academic_calendars')
        .update({ active: true })
        .eq('id', id)
      
      if (error) throw error
      
      // Refresh calendars
      fetchCalendars()
    } catch (err) {
      console.error('Error setting active calendar:', err)
      setError('Failed to set calendar as active')
    }
  }

  const handleDeleteCalendar = async (calendarId: string, filePath: string) => {
    if (!window.confirm('Are you sure you want to delete this academic calendar? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeletingCalendar(calendarId)
      
      // Extract the storage path from the URL
      const urlParts = filePath.split('/')
      const storageFilePath = `academic-calendars/${urlParts[urlParts.length - 1]}`
      
      // Delete file from storage
      const { error: storageError } = await supabase
        .storage
        .from('academic-files')
        .remove([storageFilePath])
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue with database deletion anyway
      }
      
      // Delete record from database
      const { error: dbError } = await supabase
        .from('academic_calendars')
        .delete()
        .eq('id', calendarId)
      
      if (dbError) throw dbError
      
      // Refresh calendars
      setCalendars(calendars.filter(cal => cal.id !== calendarId))
    } catch (err) {
      console.error('Error deleting calendar:', err)
      setError('Failed to delete calendar')
    } finally {
      setDeletingCalendar(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (_) {
      return dateString
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
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
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Academic Calendar Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchCalendars}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 hover:border-emerald-500/30"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-8 bg-gray-800/70 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Upload New Academic Calendar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              PDF File
            </label>
            <div className="flex items-center mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-emerald-400" />
                <span className="text-white">Select PDF File</span>
              </button>
            </div>
            
            {selectedFile && (
              <div className="bg-gray-700/30 p-3 rounded-lg flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DocumentIcon className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-white text-sm truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          <div>
            <div className="mb-4">
              <label htmlFor="semester" className="block text-sm font-medium text-gray-300 mb-1">
                Semester
              </label>
              <input
                id="semester"
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g., Fall 2023"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter the semester/academic period this calendar covers
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this calendar..."
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        
        {uploadError && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded-lg mb-4">
            {uploadError}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="bg-emerald-900/20 border border-emerald-800 text-emerald-400 px-4 py-2 rounded-lg mb-4">
            {uploadSuccess}
          </div>
        )}
        
        {isUploading && (
          <div className="mb-4">
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Calendar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white p-4 border-b border-gray-700">
          Academic Calendars
        </h3>
        
        {calendars.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No academic calendars uploaded yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Upload a PDF file to add your first academic calendar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-800/50 text-gray-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {calendars.map((calendar) => (
                  <tr 
                    key={calendar.id} 
                    className={`hover:bg-gray-800/30 ${calendar.active ? 'bg-emerald-900/10' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {calendar.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(calendar.id)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 hover:bg-emerald-900/20 hover:text-emerald-400 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {calendar.semester}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-emerald-400 mr-2" />
                        <span className="text-white text-sm truncate max-w-[200px]">
                          {calendar.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatFileSize(calendar.file_size)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(calendar.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">
                      {calendar.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={calendar.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/30 transition-colors"
                          title="View Calendar"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </a>
                        <a
                          href={calendar.file_url}
                          download
                          className="p-1.5 bg-emerald-900/20 text-emerald-400 rounded-lg hover:bg-emerald-900/30 transition-colors"
                          title="Download Calendar"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteCalendar(calendar.id, calendar.file_url)}
                          disabled={deletingCalendar === calendar.id}
                          className="p-1.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          title="Delete Calendar"
                        >
                          {deletingCalendar === calendar.id ? (
                            <div className="animate-spin h-4 w-4 border-b-2 border-red-400 rounded-full"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 