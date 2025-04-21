import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  ShieldCheckIcon,
  TrashIcon,
  EyeIcon,
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ReportedComment {
  id: string // report id
  comment_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  updated_at: string
  reporter_id: string
  reporter: {
    full_name?: string
    email?: string
  }
  comment: {
    content: string
    created_at: string
    user_id: string
    course_code: string
    user: {
      full_name?: string
      email?: string
    }
  }
}

export default function CommentReportsTable() {
  const [reports, setReports] = useState<ReportedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingReportId, setProcessingReportId] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportedComment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'all'>('pending')

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build the query based on the active tab
      let query = supabase
        .from('comment_reports')
        .select(`
          id,
          comment_id,
          reason,
          details,
          status,
          created_at,
          updated_at,
          reporter_id,
          reporter:students!reporter_id(full_name, email),
          comment:course_comments!comment_id(
            content,
            created_at,
            user_id,
            course_code,
            user:students!user_id(full_name, email)
          )
        `)
        .order('created_at', { ascending: false })
      
      // Filter based on tab
      if (activeTab === 'pending') {
        query = query.eq('status', 'pending')
      } else if (activeTab === 'reviewed') {
        query = query.or('status.eq.reviewed,status.eq.dismissed')
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      // Cast and set the data
      setReports(data as unknown as ReportedComment[] || [])
    } catch (err) {
      console.error('Error fetching comment reports:', err)
      setError('Failed to fetch comment reports')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (report: ReportedComment) => {
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
      
      // Update the report status
      const { error } = await supabase
        .from('comment_reports')
        .update({
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
      
      if (error) throw error
      
      // If action is 'reviewed', also delete the reported comment
      if (action === 'reviewed') {
        const report = reports.find(r => r.id === reportId)
        if (report) {
          const { error: deleteError } = await supabase
            .from('course_comments')
            .delete()
            .eq('id', report.comment_id)
          
          if (deleteError) throw deleteError
        }
      }
      
      // Update the UI
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: action }
            : report
        )
      )
      
      toast.success(
        action === 'reviewed' 
          ? 'Report reviewed and comment removed' 
          : 'Report dismissed successfully'
      )
      
      // Close the modal if open
      if (selectedReport?.id === reportId) {
        handleCloseModal()
      }
    } catch (err) {
      console.error(`Error ${action} report:`, err)
      toast.error(`Failed to ${action === 'reviewed' ? 'remove' : 'dismiss'} the reported comment`)
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

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'spam': 'Spam or misleading',
      'inappropriate': 'Inappropriate content',
      'harassment': 'Harassment or bullying',
      'hate_speech': 'Hate speech',
      'misinformation': 'False information',
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
          <h2 className="text-2xl font-bold text-white">Comment Reports</h2>
          <p className="text-gray-400 text-sm">
            Review and manage reported comments from students
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
          Processed
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
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <FlagIcon className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-300 mb-2">No reports found</h3>
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? 'There are no pending reports to review.' 
              : activeTab === 'reviewed' 
                ? 'There are no processed reports to display.' 
                : 'There are no comment reports in the system.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-gray-800/50 backdrop-blur-sm">
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Reported Comment</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Reason</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Status</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Reported On</th>
                <th className="px-4 py-3 text-gray-300 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {reports.map((report) => (
                <motion.tr 
                  key={report.id} 
                  className="hover:bg-gray-800/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-4 py-4">
                    <div className="max-w-md">
                      <p className="text-white truncate">
                        {report.comment?.content.substring(0, 100)}
                        {report.comment?.content.length > 100 ? '...' : ''}
                      </p>
                      <div className="flex flex-col text-sm mt-1">
                        <span className="text-gray-400">
                          By: {report.comment?.user?.full_name || 'Unknown user'}
                        </span>
                        <span className="text-emerald-500 font-mono text-xs">
                          {report.comment?.course_code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {getReasonLabel(report.reason)}
                      </span>
                      <span className="text-sm text-gray-400">
                        By: {report.reporter?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleProcessReport(report.id, 'reviewed')}
                            disabled={processingReportId === report.id}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-colors disabled:opacity-50"
                            title="Remove Comment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleProcessReport(report.id, 'dismissed')}
                            disabled={processingReportId === report.id}
                            className="p-2 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border border-gray-500/20 hover:border-gray-500/30 transition-colors disabled:opacity-50"
                            title="Dismiss Report"
                          >
                            <ArchiveBoxXMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Details Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-3xl z-10 overflow-hidden">
            <div className="bg-gray-800 py-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FlagIcon className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Report Details</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Report Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Reported By</p>
                      <p className="text-white">{selectedReport.reporter?.full_name || 'Unknown user'}</p>
                      <p className="text-sm text-gray-500">{selectedReport.reporter?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Reason</p>
                      <p className="text-white">{getReasonLabel(selectedReport.reason)}</p>
                    </div>
                    
                    {selectedReport.details && (
                      <div>
                        <p className="text-sm text-gray-400">Additional Details</p>
                        <p className="text-white">{selectedReport.details}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Report Date</p>
                      <p className="text-white">{formatDate(selectedReport.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Reported Comment</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Course</p>
                      <p className="text-emerald-500 font-mono">{selectedReport.comment?.course_code}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Comment Author</p>
                      <p className="text-white">{selectedReport.comment?.user?.full_name || 'Unknown user'}</p>
                      <p className="text-sm text-gray-500">{selectedReport.comment?.user?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Content</p>
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-white mt-1">
                        {selectedReport.comment?.content}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Posted On</p>
                      <p className="text-white">{formatDate(selectedReport.comment?.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 p-4 flex justify-end gap-3">
              {selectedReport.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleProcessReport(selectedReport.id, 'dismissed')}
                    disabled={processingReportId === selectedReport.id}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArchiveBoxXMarkIcon className="h-4 w-4" />
                    <span>Dismiss Report</span>
                  </button>
                  
                  <button
                    onClick={() => handleProcessReport(selectedReport.id, 'reviewed')}
                    disabled={processingReportId === selectedReport.id}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Remove Comment</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 