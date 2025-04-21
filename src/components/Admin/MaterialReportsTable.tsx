import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  ShieldCheckIcon,
  TrashIcon,
  EyeIcon,
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  FlagIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ReportedMaterial {
  id: string // report id
  material_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  updated_at: string
  reporter_id: string
  reporter: {
    full_name?: string
    email?: string
    student_id?: string
  }
  material: {
    file_name: string
    file_type: string
    file_url: string
    file_size: number
    description: string | null
    uploaded_at: string
    course_code: string
    user_id: string
    user_info: {
      full_name?: string
      email?: string
      student_id?: string
    }
  }
}

export default function MaterialReportsTable() {
  const [reports, setReports] = useState<ReportedMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingReportId, setProcessingReportId] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportedMaterial | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'all'>('pending')

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching material reports with tab: ${activeTab}`)
      
      // Use the API endpoint instead of direct database access
      const response = await fetch(`/api/admin/material-reports?status=${activeTab}`, {
        // Add headers for better error handling
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      // Check for redirect to login page
      if (response.redirected) {
        console.log('Redirected to:', response.url)
        window.location.href = response.url
        return
      }
      
      if (!response.ok) {
        let errorMessage = `Server responded with status ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error('Error parsing error response:', e)
        }
        
        console.error('Error response from API:', errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log(`Received ${data.reports?.length || 0} material reports`)
      setReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching material reports:', err)
      setError(`Failed to fetch material reports: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (report: ReportedMaterial) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedReport(null)
  }

  const handleProcessReport = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    try {
      setProcessingReportId(reportId)
      
      console.log(`Processing report ${reportId} with action: ${action}`)
      
      // Use the API endpoint instead of direct database access
      const response = await fetch('/api/admin/material-reports', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportId, action })
      })
      
      // Check for redirect to login page
      if (response.redirected) {
        console.log('Redirected to:', response.url)
        window.location.href = response.url
        return
      }
      
      if (!response.ok) {
        let errorMessage = `Server responded with status ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error('Error parsing error response:', e)
        }
        
        console.error('Error response from API:', errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('API response:', data)
      
      // Update the UI
      setReports(prevReports => 
        prevReports.map(r => 
          r.id === reportId 
            ? { ...r, status: action }
            : r
        )
      )
      
      toast.success(data.message || (
        action === 'reviewed' 
          ? 'Report reviewed and material processed' 
          : 'Report dismissed successfully'
      ))
      
      // Close the modal if open
      if (selectedReport?.id === reportId) {
        handleCloseModal()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Error ${action} report:`, err)
      toast.error(`Failed to ${action === 'reviewed' ? 'remove' : 'dismiss'} the reported material: ${errorMessage}`)
    } finally {
      setProcessingReportId(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch (err) {
      return dateString
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'inappropriate': 'Inappropriate content',
      'copyright': 'Copyright violation',
      'outdated': 'Outdated or incorrect information',
      'duplicate': 'Duplicate material',
      'quality': 'Poor quality or unreadable',
      'other': 'Other reasons'
    }
    return reasonMap[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Pending
          </span>
        )
      case 'reviewed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Reviewed
          </span>
        )
      case 'dismissed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Dismissed
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Material Reports</h2>
          <p className="text-gray-400 text-sm">
            Review and manage reported course materials from students
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 hover:border-emerald-500/30"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeTab === 'pending' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('reviewed')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeTab === 'reviewed' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeTab === 'all' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Reports
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gray-800/30 rounded-xl p-10 mt-6">
          <DocumentIcon className="h-14 w-14 text-gray-600 mb-3" />
          <h3 className="text-xl font-medium text-white mb-2">No {activeTab === 'all' ? '' : activeTab} reports found</h3>
          <p className="text-gray-400 text-center">
            {activeTab === 'pending' 
              ? 'There are currently no pending material reports to review.' 
              : activeTab === 'reviewed'
                ? 'No material reports have been reviewed yet.'
                : 'No materials have been reported yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-gray-800/50 backdrop-blur-sm">
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Material</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Reason</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Reporter</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Uploader</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Course</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Date</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Status</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <a 
                        href={report.material.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-medium flex items-center gap-1"
                      >
                        <DocumentIcon className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {report.material.file_name}
                        </span>
                      </a>
                      <span className="text-sm text-gray-400">{formatFileSize(report.material.file_size)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <span className="text-white">{getReasonLabel(report.reason)}</span>
                      {report.details && (
                        <p className="text-sm text-gray-400 truncate max-w-[150px]">
                          {report.details}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-white">{report.reporter.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-400">{report.reporter.email}</div>
                    {report.reporter.student_id && (
                      <div className="text-xs text-gray-500">ID: {report.reporter.student_id}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-white">{report.material.user_info?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-400">{report.material.user_info?.email}</div>
                    {report.material.user_info?.student_id && (
                      <div className="text-xs text-gray-500">ID: {report.material.user_info.student_id}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-white">{report.material.course_code}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-white">{formatDate(report.created_at)}</div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleProcessReport(report.id, 'reviewed')}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Review and remove material"
                            disabled={processingReportId === report.id}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleProcessReport(report.id, 'dismissed')}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                            title="Dismiss report"
                            disabled={processingReportId === report.id}
                          >
                            <ArchiveBoxXMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl w-full max-w-3xl z-10 overflow-hidden"
          >
            <div className="flex justify-between items-start p-6 border-b border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FlagIcon className="h-5 w-5 text-red-500" />
                  Reported Material Details
                </h3>
                <p className="text-gray-400">{formatDate(selectedReport.created_at)}</p>
              </div>
              
              <button 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-2">Material</h4>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <a 
                        href={selectedReport.material.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-medium text-lg flex items-center gap-1"
                      >
                        <DocumentIcon className="h-5 w-5" />
                        {selectedReport.material.file_name}
                      </a>
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <span className="bg-gray-700 px-2 py-1 rounded">
                          {formatFileSize(selectedReport.material.file_size)}
                        </span>
                      </div>
                    </div>
                    
                    {selectedReport.material.description && (
                      <p className="text-gray-300 mb-2">{selectedReport.material.description}</p>
                    )}
                    
                    <div className="text-gray-400 text-sm">
                      Uploaded by {selectedReport.material.user_info?.full_name || 'Unknown'} on {formatDate(selectedReport.material.uploaded_at)}
                    </div>
                    
                    <div className="text-gray-400 text-sm mt-1">
                      <span className="font-medium">Student ID:</span> {selectedReport.material.user_info?.student_id || 'N/A'}
                    </div>
                    
                    <div className="text-gray-400 text-sm mt-1">
                      <span className="font-medium">Email:</span> {selectedReport.material.user_info?.email || 'N/A'}
                    </div>
                    
                    <div className="flex mt-4">
                      <a 
                        href={selectedReport.material.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-6-6m0 0l6-6m-6 6h18"></path>
                        </svg>
                        Open Material
                      </a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Report Information</h4>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Reason:</p>
                        <p className="text-white">{getReasonLabel(selectedReport.reason)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status:</p>
                        <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                      </div>
                    </div>
                    
                    {selectedReport.details && (
                      <div className="mt-4">
                        <p className="text-gray-400 text-sm">Additional Details:</p>
                        <p className="text-white mt-1 bg-gray-800 p-3 rounded border border-gray-700">
                          {selectedReport.details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Reporter</h4>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-500/20 rounded-full p-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedReport.reporter.full_name || 'Unknown'}</p>
                      <p className="text-gray-400 text-sm">{selectedReport.reporter.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 border-t border-gray-700/50 pt-2">
                    <p className="text-gray-400 text-sm"><span className="font-medium">Student ID:</span> {selectedReport.reporter.student_id || 'N/A'}</p>
                  </div>
                </div>
                
                <h4 className="text-lg font-medium text-white mb-2">Course</h4>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 rounded-full p-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <p className="text-white font-medium">{selectedReport.material.course_code}</p>
                  </div>
                </div>
                
                {selectedReport.status === 'pending' && (
                  <div className="space-y-3 mt-4">
                    <button
                      onClick={() => handleProcessReport(selectedReport.id, 'reviewed')}
                      disabled={processingReportId === selectedReport.id}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingReportId === selectedReport.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                      Remove Material
                    </button>
                    
                    <button
                      onClick={() => handleProcessReport(selectedReport.id, 'dismissed')}
                      disabled={processingReportId === selectedReport.id}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingReportId === selectedReport.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <ArchiveBoxXMarkIcon className="h-5 w-5" />
                      )}
                      Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 