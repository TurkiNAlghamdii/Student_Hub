/**
 * Support Requests Component
 * 
 * This client-side component provides an administrative interface for managing
 * user support requests in the Student Hub application. It allows administrators
 * to view, filter, search, and update the status of support tickets submitted by users.
 * 
 * Key features:
 * - Comprehensive list of support requests with detailed information
 * - Status tracking and management (pending, in progress, resolved)
 * - Search and filter capabilities for efficient request handling
 * - Statistical overview of support request status distribution
 * - Responsive design for various screen sizes
 * 
 * The component integrates with the application's theme system through consistent
 * styling that adapts to both light and dark modes, ensuring a cohesive visual
 * experience across the admin dashboard while maintaining readability and usability
 * in both theme contexts.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

/**
 * Support Request Interface
 * 
 * Defines the structure of a support request object retrieved from the database.
 * This interface ensures type safety when working with support request data
 * throughout the management interface.
 * 
 * @property id - Unique identifier for the support request
 * @property email - Email address of the user who submitted the request
 * @property issue_type - Category of the support issue (e.g., 'technical', 'account')
 * @property description - Detailed description of the issue provided by the user
 * @property status - Current status of the request (pending, in_progress, resolved)
 * @property created_at - Timestamp when the request was submitted
 * @property updated_at - Timestamp when the request was last updated, or null if not updated
 */
interface SupportRequest {
  id: string
  email: string
  issue_type: string
  description: string
  status: string
  created_at: string
  updated_at: string | null
}

/**
 * Status Filter Type
 * 
 * Defines the possible values for filtering support requests by status.
 * This type ensures that only valid status filter values can be used.
 */
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved'

/**
 * Support Requests Component
 * 
 * Main component for managing user support requests in the admin dashboard.
 * This component handles fetching, displaying, filtering, and updating the status
 * of support tickets submitted by users of the Student Hub application.
 * 
 * The component implements theme-aware styling that adapts to the application's
 * light or dark theme, ensuring consistent visual appearance and readability
 * across theme changes.
 * 
 * @returns React component for support request management interface
 */
export default function SupportRequests() {
  // State for storing all requests and filtered requests based on search/filters
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SupportRequest[]>([])

  // State for search and filtering functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // State for loading and error handling
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for request operations
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // State to track if we're in a browser environment for portal rendering
  const [isBrowser, setIsBrowser] = useState(false)

  // State for support request statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0
  })

  // Set isBrowser to true after component mounts (for portal rendering)
  useEffect(() => {
    setIsBrowser(true)
  }, [])

  // Fetch all support requests
  useEffect(() => {
    fetchRequests()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter requests based on search query and status filter
  useEffect(() => {
    if (!requests.length) {
      setFilteredRequests([])
      return
    }

    let filtered = [...requests]
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => normalizeStatus(request.status) === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(request => 
        request.email.toLowerCase().includes(query) || 
        request.issue_type.toLowerCase().includes(query) || 
        request.description.toLowerCase().includes(query)
      )
    }
    
    setFilteredRequests(filtered)
  }, [requests, searchQuery, statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the session for auth token
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) {
        throw new Error('Not authenticated')
      }
      
      // Use our API endpoint instead
      const response = await fetch('/api/admin/support-requests', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch support requests')
      }
      
      // If we got data but it's empty, show a more helpful message
      if (!result.data || result.data.length === 0) {
        setError('No support requests found. There are no tickets in the system yet.')
        setLoading(false)
        return
      }
      
      const typedData = (result.data as SupportRequest[] || []).map(request => ({
        ...request,
        // Normalize status values
        status: normalizeStatus(request.status)
      }))
      
      setRequests(typedData)
      setFilteredRequests(typedData)
      
      // Calculate stats
      const pendingCount = typedData.filter(r => r.status === 'pending').length
      const inProgressCount = typedData.filter(r => r.status === 'in_progress').length
      const resolvedCount = typedData.filter(r => r.status === 'resolved').length
      
      setStats({
        total: typedData.length,
        pending: pendingCount,
        in_progress: inProgressCount,
        resolved: resolvedCount
      })
    } catch (err) {
      console.error('Error fetching support requests:', err)
      setError(`Failed to fetch support requests: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status)
  }

  const handleUpdateStatus = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      setUpdating(requestId)
      
      // Get the session for auth token
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) {
        throw new Error('Not authenticated')
      }
      
      // Use our API endpoint for updating
      const response = await fetch(`/api/admin/support-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update support request')
      }
      
      // Prepare the current time for the update
      const now = new Date().toISOString()
      
      // Update the request in state
      const updatedRequests = requests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: newStatus,
            updated_at: now
          }
        }
        return req
      })
      
      setRequests(updatedRequests)
      
      // Update selected request if it's the one being viewed
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({
          ...selectedRequest,
          status: newStatus,
          updated_at: now
        })
      }
      
      // Update stats
      const pendingCount = updatedRequests.filter(r => r.status === 'pending').length
      const inProgressCount = updatedRequests.filter(r => r.status === 'in_progress').length
      const resolvedCount = updatedRequests.filter(r => r.status === 'resolved').length
      
      setStats({
        total: updatedRequests.length,
        pending: pendingCount,
        in_progress: inProgressCount,
        resolved: resolvedCount
      })
    } catch (err) {
      console.error('Error updating support request:', err)
      setError(`Failed to update support request status: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'resolved':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'in_progress':
        return <ExclamationCircleIcon className="h-4 w-4" />
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not updated';
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
    } catch (_) {
      return dateString;
    }
  }

  // Validate and standardize status for display and filtering
  const normalizeStatus = (status: string): 'pending' | 'in_progress' | 'resolved' => {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'in_progress' || normalized === 'in-progress' || normalized === 'inprogress') {
      return 'in_progress';
    } else if (normalized === 'resolved' || normalized === 'completed' || normalized === 'done' || normalized === 'closed') {
      return 'resolved';
    } else {
      // Default to pending for any other value
      return 'pending';
    }
  }

  const viewRequestDetails = (request: SupportRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const getNextStatus = (currentStatus: string): 'pending' | 'in_progress' | 'resolved' => {
    switch (currentStatus) {
      case 'pending':
        return 'in_progress'
      case 'in_progress':
        return 'resolved'
      case 'resolved':
        return 'pending'
      default:
        return 'pending'
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
        <h2 className="text-2xl font-bold text-white">Support Requests</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 hover:border-emerald-500/30 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm">Total Requests</p>
            <p className="text-2xl font-semibold text-white">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-semibold text-yellow-400">{stats.pending}</p>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm">In Progress</p>
            <p className="text-2xl font-semibold text-blue-400">{stats.in_progress}</p>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-2xl font-semibold text-emerald-400">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search by email, issue type, or description..."
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
        
        <div className="flex gap-2 items-center">
          <div className="flex items-center text-gray-400 mr-2">
            <FunnelIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition-colors ${statusFilter === 'all'
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-800'
              }`}
            >
              <span>All Tickets</span>
              <span className="bg-gray-600 text-white text-xs rounded-full px-1.5">{stats.total}</span>
            </button>
            <button
              onClick={() => handleStatusFilterChange('pending')}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition-colors ${statusFilter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-800'
              }`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              <span>Awaiting</span>
              <span className={`${statusFilter === 'pending' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-gray-600 text-white'} text-xs rounded-full px-1.5`}>{stats.pending}</span>
            </button>
            <button
              onClick={() => handleStatusFilterChange('in_progress')}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition-colors ${statusFilter === 'in_progress'
                ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-800'
              }`}
            >
              <ExclamationCircleIcon className="h-3.5 w-3.5" />
              <span>In Progress</span>
              <span className={`${statusFilter === 'in_progress' ? 'bg-blue-400/20 text-blue-300' : 'bg-gray-600 text-white'} text-xs rounded-full px-1.5`}>{stats.in_progress}</span>
            </button>
            <button
              onClick={() => handleStatusFilterChange('resolved')}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition-colors ${statusFilter === 'resolved'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                : 'bg-gray-800/30 text-gray-400 border-gray-700/50 hover:bg-gray-800'
              }`}
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              <span>Resolved</span>
              <span className={`${statusFilter === 'resolved' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-gray-600 text-white'} text-xs rounded-full px-1.5`}>{stats.resolved}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-400">
          Found {filteredRequests.length} {filteredRequests.length === 1 ? 'ticket' : 'tickets'} matching &quot;{searchQuery}&quot;
        </div>
      )}

      {/* Support requests table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800/60">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-gray-800/50 backdrop-blur-sm">
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Email</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Issue Type</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Status</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm hidden md:table-cell">Created</th>
              <th className="px-4 py-3 text-gray-300 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-white font-medium">{request.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-300">
                      {request.issue_type}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300 hidden md:table-cell">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {/* View details button */}
                      <button
                        onClick={() => viewRequestDetails(request)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                      
                      {/* Update status button */}
                      <button
                        onClick={() => handleUpdateStatus(request.id, getNextStatus(request.status))}
                        disabled={updating === request.id}
                        className={`p-2 rounded-lg flex items-center gap-1 ${
                          request.status === 'resolved'
                            ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/30'
                            : request.status === 'pending'
                              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30'
                        } transition-colors disabled:opacity-50`}
                        title={request.status === 'resolved' 
                          ? 'Reopen as Pending'
                          : request.status === 'pending'
                            ? 'Mark as In Progress'
                            : 'Mark as Resolved'}
                      >
                        {updating === request.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b border-current"></div>
                        ) : (
                          <>
                            {request.status === 'resolved' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                              </svg>
                            ) : request.status === 'pending' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline text-xs whitespace-nowrap">
                              {request.status === 'resolved'
                                ? 'Reopen'
                                : request.status === 'pending'
                                  ? 'Start'
                                  : 'Resolve'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  {searchQuery || statusFilter !== 'all' ? (
                    <div>
                      <div>No support requests match your filters.</div>
                      <div className="mt-2 flex justify-center gap-2">
                        {searchQuery && (
                          <button 
                            onClick={clearSearch}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                          >
                            Clear search
                          </button>
                        )}
                        {statusFilter !== 'all' && (
                          <button 
                            onClick={() => handleStatusFilterChange('all')}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                          >
                            Show all statuses
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>No support requests available.</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal will be rendered outside the container using createPortal */}
      {isBrowser && isModalOpen && selectedRequest && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] pt-20 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-2xl mx-auto my-8 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Support Request Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <h4 className="text-white font-medium">{selectedRequest.email}</h4>
                    </div>
                    <div className="text-sm text-gray-400">
                      Submitted {formatDate(selectedRequest.created_at)}
                    </div>
                    {selectedRequest.created_at !== selectedRequest.updated_at && (
                      <div className="text-sm text-gray-400">
                        Last updated {formatDate(selectedRequest.updated_at)}
                      </div>
                    )}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1 capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-medium mb-2">Issue Type</h4>
                <div className="text-gray-300">{selectedRequest.issue_type}</div>
              </div>
              
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-medium mb-2">Description</h4>
                <div className="text-gray-300 whitespace-pre-wrap">{selectedRequest.description}</div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, getNextStatus(selectedRequest.status))}
                  disabled={updating === selectedRequest.id}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedRequest.status === 'resolved'
                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/30'
                      : selectedRequest.status === 'pending'
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30'
                  } disabled:opacity-50`}
                >
                  {updating === selectedRequest.id ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b border-current"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      {selectedRequest.status === 'resolved' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                          </svg>
                          <span>Reopen as Pending</span>
                        </>
                      ) : selectedRequest.status === 'pending' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          <span>Start Working (In Progress)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Mark as Resolved</span>
                        </>
                      )}
                    </>
                  )}
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
        </div>,
        document.body
      )}
    </div>
  )
}