/**
 * File Management Component
 * 
 * This client-side component provides an administrative interface for managing
 * files uploaded to the Student Hub application. It allows administrators to view,
 * search, filter, preview, download, and delete files, as well as view storage
 * statistics and metrics.
 * 
 * Key features:
 * - Comprehensive file listing with search and filter capabilities
 * - File preview and download functionality
 * - Storage usage statistics by course and file type
 * - Batch file deletion for efficient management
 * - Responsive design for various screen sizes
 * 
 * The component integrates with the application's theme system through consistent
 * styling that adapts to both light and dark modes, ensuring a cohesive visual
 * experience across the admin dashboard while maintaining readability and usability
 * in both theme contexts.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  DocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

/**
 * File Data Interface
 * 
 * Defines the structure of a file object retrieved from the database.
 * This interface ensures type safety when working with file data throughout
 * the management interface.
 * 
 * @property id - Unique identifier for the file
 * @property file_name - Original name of the uploaded file
 * @property file_size - Size of the file in bytes
 * @property file_type - MIME type of the file (e.g., 'application/pdf')
 * @property file_url - URL to access the file from storage
 * @property description - Optional description of the file
 * @property uploaded_at - Timestamp when the file was uploaded
 * @property course_code - Course code the file is associated with
 * @property user_id - ID of the user who uploaded the file
 * @property student_id - Optional student ID of the uploader
 */
interface FileData {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  description: string | null
  uploaded_at: string
  course_code: string
  user_id: string
  student_id?: string | number
}

/**
 * Storage Summary Interface
 * 
 * Defines the structure of the storage usage summary data.
 * This interface is used to track and display storage metrics
 * for administrative purposes.
 * 
 * @property totalFiles - Total number of files in the system
 * @property totalSize - Total storage used in bytes
 * @property byCourse - Breakdown of storage usage by course code
 * @property byType - Breakdown of storage usage by file type
 */
interface StorageSummary {
  totalFiles: number
  totalSize: number
  byCourse: Record<string, { files: number, size: number }>
  byType: Record<string, { files: number, size: number }>
}

/**
 * File Management Component
 * 
 * Main component for the file management interface in the admin dashboard.
 * This component handles fetching, displaying, filtering, and managing files
 * stored in the application's storage system.
 * 
 * @returns React component for file management interface
 */
export default function FileManagement() {
  // State for storing all files and filtered files based on search/filters
  const [files, setFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('')
  
  // State for loading and error handling
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for file operations
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // State for storage usage statistics
  const [storageSummary, setStorageSummary] = useState<StorageSummary>({
    totalFiles: 0,
    totalSize: 0,
    byCourse: {},
    byType: {}
  })
  const [totalStorageUsed, setTotalStorageUsed] = useState('0 MB')

  // Fetch all files 
  useEffect(() => {
    fetchFiles();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = files.filter(file => 
      file.file_name.toLowerCase().includes(query) || 
      (file.student_id && typeof file.student_id === 'string' && file.student_id.toLowerCase().includes(query)) ||
      file.user_id.toLowerCase().includes(query) ||
      file.course_code.toLowerCase().includes(query) ||
      (file.description && file.description.toLowerCase().includes(query))
    )
    setFilteredFiles(filtered)
  }, [searchQuery, files])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, fetch the course files
      const { data: filesData, error: fetchError } = await supabase
        .from('course_files')
        .select(`
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          description,
          uploaded_at,
          course_code,
          user_id
        `)
        .order('uploaded_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // Cast the data to match our interface
      const typedData = filesData as unknown as FileData[] || []
      
      // For each file, try to get the student_id
      const filesWithStudentIds = await Promise.all(typedData.map(async (file) => {
        try {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('student_id')
            .eq('id', file.user_id)
            .single()
            
          if (!studentError && studentData) {
            return {
              ...file,
              student_id: studentData.student_id ? String(studentData.student_id) : undefined
            }
          }
        } catch (err) {
          console.error(`Error fetching student info for user ${file.user_id}:`, err)
        }
        return file
      }))
      
      setFiles(filesWithStudentIds)
      setFilteredFiles(filesWithStudentIds)
      
      // Generate storage summary
      calculateStorageSummary(filesWithStudentIds)
    } catch (err) {
      console.error('Error fetching files:', err)
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const calculateStorageSummary = (fileData: FileData[]) => {
    const summary: StorageSummary = {
      totalFiles: fileData.length,
      totalSize: 0,
      byCourse: {},
      byType: {}
    }
    
    // Group and sum by course and file type
    fileData.forEach(file => {
      // Add to total size
      summary.totalSize += file.file_size
      
      // Add to course stats
      if (!summary.byCourse[file.course_code]) {
        summary.byCourse[file.course_code] = { files: 0, size: 0 }
      }
      summary.byCourse[file.course_code].files += 1
      summary.byCourse[file.course_code].size += file.file_size
      
      // Simplify file type for grouping (e.g., "application/pdf" -> "pdf")
      const simpleType = simplifyFileType(file.file_type)
      
      // Add to type stats
      if (!summary.byType[simpleType]) {
        summary.byType[simpleType] = { files: 0, size: 0 }
      }
      summary.byType[simpleType].files += 1
      summary.byType[simpleType].size += file.file_size
    })
    
    setStorageSummary(summary)
    setTotalStorageUsed(formatFileSize(summary.totalSize))
  }

  const simplifyFileType = (fileType: string): string => {
    // Extract the main type from the MIME type
    const parts = fileType.split('/')
    
    if (parts.length > 1) {
      // Handle special cases for Microsoft Office formats
      if (parts[1].includes('officedocument.wordprocessingml')) return 'word'
      if (parts[1].includes('officedocument.spreadsheetml')) return 'excel'
      if (parts[1].includes('officedocument.presentationml')) return 'powerpoint'
      if (parts[1] === 'msword') return 'word'
      if (parts[1] === 'vnd.ms-excel') return 'excel'
      if (parts[1] === 'vnd.ms-powerpoint') return 'powerpoint'
      
      // Return the subtype (pdf, jpeg, etc.)
      return parts[1]
    }
    
    return fileType
  }

  const getFileTypeIcon = (fileType: string) => {
    const simplified = simplifyFileType(fileType)
    
    // Return appropriate icon based on file type
    switch (simplified) {
      case 'pdf':
        return <DocumentTextIcon className="h-5 w-5 text-red-400" />
      case 'word':
        return <DocumentTextIcon className="h-5 w-5 text-blue-400" />
      case 'excel':
        return <DocumentTextIcon className="h-5 w-5 text-green-400" />
      case 'powerpoint':
        return <DocumentTextIcon className="h-5 w-5 text-orange-400" />
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'jpg':
        return <DocumentTextIcon className="h-5 w-5 text-purple-400" />
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleDeleteFile = async (fileId: string, courseCode: string) => {
    try {
      setDeletingFile(fileId)
      
      // Get the user's ID for the request header
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      
      // Use the API endpoint to handle deletion with proper permissions
      const response = await fetch(`/api/courses/${courseCode}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to delete file: ${errorData.error || response.statusText}`)
      }
      
      // Remove from state
      const updatedFiles = files.filter(file => file.id !== fileId)
      setFiles(updatedFiles)
      setFilteredFiles(filteredFiles.filter(file => file.id !== fileId))
      calculateStorageSummary(updatedFiles)
      
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
        setIsModalOpen(false)
      }
    } catch (err) {
      console.error('Error deleting file:', err)
      setError(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setDeletingFile(null)
    }
  }

  const openFileDetails = (file: FileData) => {
    setSelectedFile(file)
    setIsModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch (_) {
      return dateString
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">File Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchFiles}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 hover:border-emerald-500/30"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Storage Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-white text-lg font-medium mb-2">Storage Usage</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Files</p>
              <p className="text-xl font-semibold text-white">{storageSummary.totalFiles}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Size</p>
              <p className="text-xl font-semibold text-emerald-400">{totalStorageUsed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-white text-lg font-medium mb-2">Top Courses</h3>
          <div className="space-y-2">
            {Object.entries(storageSummary.byCourse)
              .sort((a, b) => b[1].size - a[1].size)
              .slice(0, 3)
              .map(([course, stats]) => (
                <div key={course} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 text-emerald-400 mr-2" />
                    <span className="text-white font-mono">{course}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{formatFileSize(stats.size)}</span>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-white text-lg font-medium mb-2">File Types</h3>
          <div className="space-y-2">
            {Object.entries(storageSummary.byType)
              .sort((a, b) => b[1].files - a[1].files)
              .slice(0, 3)
              .map(([type, stats]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {getFileTypeIcon(type)}
                    <span className="text-white ml-2 capitalize">{type}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{stats.files} files</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search files by name, uploader, course code, or description..."
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-400">
            Found {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800/60">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-gray-800/50 backdrop-blur-sm">
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">File</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Course</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Size</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Uploader</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Date</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getFileTypeIcon(file.file_type)}
                      </div>
                      <div>
                        <p className="text-white font-medium truncate max-w-xs">{file.file_name}</p>
                        {file.description && (
                          <p className="text-gray-400 text-sm truncate max-w-xs">{file.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-emerald-400 mr-2" />
                      <span className="text-emerald-500 font-mono">{file.course_code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">
                        {file.student_id 
                          ? `Student ID: ${String(file.student_id)}` 
                          : `User ID: ${file.user_id.substring(0, 8)}...`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {formatDate(file.uploaded_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => openFileDetails(file)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.course_code)}
                        disabled={deletingFile === file.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {deletingFile === file.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b border-red-400"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  {searchQuery ? (
                    <div>
                      <div>No files found matching your search.</div>
                      <button 
                        onClick={clearSearch}
                        className="mt-2 text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div>No files available.</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* File Details Modal */}
      {isModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-2xl mx-auto my-8 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">File Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-700/50 p-3 rounded-full">
                    {getFileTypeIcon(selectedFile.file_type)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{selectedFile.file_name}</h4>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.file_size)} • Uploaded {formatDate(selectedFile.uploaded_at)}</p>
                  </div>
                </div>
                
                {selectedFile.description && (
                  <div className="mt-2">
                    <h5 className="text-gray-400 text-sm mb-1">Description</h5>
                    <p className="text-white">{selectedFile.description}</p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <a
                    href={selectedFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20 hover:border-blue-500/30 flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download
                  </a>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Uploader Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700/50 p-2 rounded-full">
                      <UserCircleIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-white">
                      {selectedFile.student_id 
                        ? `Student ID: ${String(selectedFile.student_id)}` 
                        : `User ID: ${selectedFile.user_id}`}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Course Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700/50 p-2 rounded-full">
                      <AcademicCapIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-emerald-500 font-mono">{selectedFile.course_code}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleDeleteFile(selectedFile.id, selectedFile.course_code)}
                  disabled={deletingFile === selectedFile.id}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/30 flex items-center gap-2"
                >
                  {deletingFile === selectedFile.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b border-red-400 mr-2"></div>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                  Delete File
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 