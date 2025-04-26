/**
 * Content Moderation Component
 * 
 * This client-side component provides a comprehensive administrative interface for
 * moderating user-generated content in the Student Hub application. It allows administrators
 * to review, search, and manage comments, as well as handle reported content.
 * 
 * Key features:
 * - Tabbed interface for different moderation tasks (comments, reported comments, reported materials)
 * - Search functionality for filtering comments
 * - Detailed view of comments with user information
 * - Actions to delete inappropriate content
 * - Integration with specialized report management components
 * 
 * The component integrates with the application's theme system through consistent
 * styling that adapts to the dark theme used in the admin interface, ensuring
 * a cohesive visual experience across the admin dashboard.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  UserCircleIcon,
  FlagIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import CommentReportsTable from './CommentReportsTable'
import MaterialReportsTable from './MaterialReportsTable'

/**
 * Comment Interface
 * 
 * Defines the structure of a comment object retrieved from the database.
 * This interface ensures type safety when working with comment data throughout
 * the moderation interface.
 * 
 * @property id - Unique identifier for the comment
 * @property content - The text content of the comment
 * @property created_at - Timestamp when the comment was created
 * @property user_id - ID of the user who created the comment
 * @property parent_id - ID of the parent comment (null for top-level comments)
 * @property course_code - Code of the course the comment belongs to
 * @property user - Optional nested object containing information about the comment author
 */
interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  course_code: string
  user?: {
    full_name?: string
    email?: string
    avatar_url?: string
    student_id?: string
  }
}

/**
 * Content Moderation Component
 * 
 * This component provides a comprehensive interface for administrators to
 * moderate user-generated content across the Student Hub platform. It includes
 * tabs for different moderation tasks and tools for searching and filtering content.
 * 
 * @returns The rendered content moderation interface
 */
export default function ContentModeration() {
  // State Management
  const [comments, setComments] = useState<Comment[]>([])             // All comments from database
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]) // Comments filtered by search
  const [searchQuery, setSearchQuery] = useState('')                  // Current search query
  const [loading, setLoading] = useState(true)                        // Loading state for comments
  const [error, setError] = useState<string | null>(null)             // Error state
  const [deletingComment, setDeletingComment] = useState<string | null>(null) // ID of comment being deleted
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null) // Comment selected for detailed view
  const [isModalOpen, setIsModalOpen] = useState(false)              // Modal visibility state
  const [activeTab, setActiveTab] = useState<'comments' | 'comment-reports' | 'material-reports'>('comments') // Current active tab

  /**
   * Initial Data Fetching Effect
   * 
   * Fetches all comments from the database when the component mounts.
   * This provides the baseline data for the comments moderation tab.
   */
  useEffect(() => {
    fetchComments()
  }, [])

  /**
   * Search Filtering Effect
   * 
   * Filters the comments based on the current search query whenever
   * the query or comments list changes. The search looks for matches in:
   * - Comment content
   * - Author's name
   * - Author's email
   * - Course code
   * 
   * This provides real-time filtering as the user types in the search box.
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredComments(comments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = comments.filter(comment => {
        return (
          comment.content.toLowerCase().includes(query) ||
          comment.user?.full_name?.toLowerCase().includes(query) ||
          comment.user?.email?.toLowerCase().includes(query) ||
          comment.course_code.toLowerCase().includes(query)
        )
      })
      setFilteredComments(filtered)
    }
  }, [searchQuery, comments])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('course_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          parent_id,
          course_code,
          user:students(full_name, email, avatar_url, student_id)
        `)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // Cast the data to match our Comment interface
      const typedData = data as unknown as Comment[] || []
      
      setComments(typedData)
      setFilteredComments(typedData)
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError('Failed to fetch comments')
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      setDeletingComment(commentId)
      
      const { error: deleteError } = await supabase
        .from('course_comments')
        .delete()
        .eq('id', commentId)
      
      if (deleteError) throw deleteError
      
      // Remove from state
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      setFilteredComments(prev => prev.filter(comment => comment.id !== commentId))
      
      if (selectedComment?.id === commentId) {
        setSelectedComment(null)
        setIsModalOpen(false)
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
      setError('Failed to delete comment')
    } finally {
      setDeletingComment(null)
    }
  }

  const openCommentDetails = (comment: Comment) => {
    setSelectedComment(comment)
    setIsModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch (_) {
      return dateString
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Moderation</h2>
          <p className="text-gray-400 text-sm">Manage comments and reported content</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('comments')}
          className={`py-2 px-4 font-medium text-sm transition-colors ${
            activeTab === 'comments' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Comments
        </button>
        <button
          onClick={() => setActiveTab('comment-reports')}
          className={`py-2 px-4 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'comment-reports' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FlagIcon className="h-4 w-4" />
          Reported Comments
        </button>
        <button
          onClick={() => setActiveTab('material-reports')}
          className={`py-2 px-4 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'material-reports' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DocumentIcon className="h-4 w-4" />
          Reported Materials
        </button>
      </div>

      {activeTab === 'comments' ? (
        <>
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
                placeholder="Search comments by content, author, or course..."
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
                Found {filteredComments.length} {filteredComments.length === 1 ? 'comment' : 'comments'} matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-800/60">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-gray-800/50 backdrop-blur-sm">
                    <th className="px-4 py-3 text-gray-300 font-medium text-sm">Content</th>
                    <th className="px-4 py-3 text-gray-300 font-medium text-sm">Author</th>
                    <th className="px-4 py-3 text-gray-300 font-medium text-sm">Course</th>
                    <th className="px-4 py-3 text-gray-300 font-medium text-sm">Date</th>
                    <th className="px-4 py-3 text-gray-300 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredComments.length > 0 ? (
                    filteredComments.map((comment) => (
                      <tr key={comment.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="max-w-md">
                            <p className="text-white truncate">
                              {comment.content.length > 100
                                ? `${comment.content.substring(0, 100)}...`
                                : comment.content
                              }
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{comment.user?.full_name || 'Unknown'}</span>
                            <span className="text-sm text-gray-400">{comment.user?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-emerald-500 font-mono">{comment.course_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-300">
                          {formatDate(comment.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCommentDetails(comment)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingComment === comment.id}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-colors"
                            >
                              {deletingComment === comment.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-400"></div>
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
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No comments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : activeTab === 'comment-reports' ? (
        <CommentReportsTable />
      ) : (
        <MaterialReportsTable />
      )}

      {/* Comment Details Modal */}
      {isModalOpen && selectedComment && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-2xl z-10 overflow-hidden">
            <div className="bg-gray-800 py-4 px-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Comment Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-700/50 p-2 rounded-full">
                        <UserCircleIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {selectedComment.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedComment.user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(selectedComment.created_at)}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700/50 pt-3 whitespace-pre-wrap">
                    {selectedComment.content}
                  </div>
                </div>
                
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Course Information</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-gray-400 text-sm">Course Code</div>
                      <div className="text-emerald-500 font-mono">{selectedComment.course_code}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => handleDeleteComment(selectedComment.id)}
                    disabled={deletingComment === selectedComment.id}
                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/30 flex items-center gap-2"
                  >
                    {deletingComment === selectedComment.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b border-red-400 mr-2"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    Delete Comment
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
        </div>
      )}
    </div>
  )
} 