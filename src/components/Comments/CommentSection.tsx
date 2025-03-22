'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import './comments.css'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  user: {
    full_name?: string
    email?: string
    avatar_url?: string
  }
}

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[]
}

interface CommentSectionProps {
  courseCode: string
}

export default function CommentSection({ courseCode }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [deletingComments, setDeletingComments] = useState<string[]>([])

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const { data, error: supabaseError } = await supabase
          .from('students')
          .select('role')
          .eq('id', user.id)
          .single()
          
        if (supabaseError) {
          console.error('Error checking admin status:', supabaseError)
          return
        }
        
        setIsAdmin(data?.role === 'admin')
      } catch (error) {
        console.error('Failed to check admin status:', error)
      }
    }
    
    checkAdminStatus()
  }, [user])

  // Function to organize comments into a hierarchical structure with parent/child relationships
  const organizeComments = (allComments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>()
    const topLevelComments: CommentWithReplies[] = []
    
    // First, create a map of all comments by their id and initialize replies array
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // Then, organize comments into parent/child relationships
    allComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add it to its parent's replies
        const parentComment = commentMap.get(comment.parent_id)!
        parentComment.replies!.push(commentWithReplies)
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithReplies)
      }
    })
    
    // Sort top-level comments by date (newest first)
    topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    // Recursive function to sort replies at all levels
    const sortReplies = (comments: CommentWithReplies[]) => {
      // Sort replies by date (oldest first) at the current level
      comments.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      // Then recursively sort replies at deeper levels
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          sortReplies(comment.replies)
        }
      })
    }
    
    // Apply recursive sorting to all top-level comments' replies
    topLevelComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        sortReplies(comment.replies)
      }
    })
    
    return topLevelComments
  }

  useEffect(() => {
    if (!courseCode) return
    
    const fetchComments = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error: supabaseError } = await supabase
          .from('course_comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            parent_id,
            user:students(full_name, email, avatar_url)
          `)
          .eq('course_code', courseCode)
          .order('created_at', { ascending: false })
          
        if (supabaseError) {
          throw supabaseError
        }
        
        const commentsWithHierarchy = organizeComments(data as Comment[] || [])
        setComments(commentsWithHierarchy)
      } catch (error: unknown) {
        console.error('Error fetching comments:', error)
        setError('Failed to load comments. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchComments()
    
    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel(`course_comments:${courseCode}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'course_comments',
        filter: `course_code=eq.${courseCode}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          // When a new comment is inserted, fetch all comments to correctly organize the hierarchy
          const fetchAllComments = async () => {
            const { data } = await supabase
              .from('course_comments')
              .select(`
                id,
                content,
                created_at,
                user_id,
                parent_id,
                user:students(full_name, email, avatar_url)
              `)
              .eq('course_code', courseCode)
            
            if (data) {
              const commentsWithHierarchy = organizeComments(data as Comment[] || [])
              setComments(commentsWithHierarchy)
            }
          }
          
          fetchAllComments()
        } else if (payload.eventType === 'DELETE') {
          // When a comment is deleted, refetch all comments to properly reorganize the hierarchy
          const fetchAllComments = async () => {
            const { data } = await supabase
              .from('course_comments')
              .select(`
                id,
                content,
                created_at,
                user_id,
                parent_id,
                user:students(full_name, email, avatar_url)
              `)
              .eq('course_code', courseCode)
            
            if (data) {
              const commentsWithHierarchy = organizeComments(data as Comment[] || [])
              setComments(commentsWithHierarchy)
            }
          }
          
          fetchAllComments()
        }
      })
      .subscribe()
      
    return () => {
      subscription.unsubscribe()
    }
  }, [courseCode])
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to post a comment')
      return
    }
    
    if (!newComment.trim()) {
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const { error: supabaseError } = await supabase
        .from('course_comments')
        .insert({
          course_code: courseCode,
          content: newComment.trim(),
          user_id: user.id,
          parent_id: null // This is a top-level comment
        })
        
      if (supabaseError) {
        throw supabaseError
      }
      
      setNewComment('')
    } catch (error: unknown) {
      console.error('Error posting comment:', error)
      setError('Failed to post your comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to reply to a comment');
      return;
    }
    
    // Get the content directly from the form's textarea
    const form = e.target as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const content = textarea?.value.trim();
    
    if (!content) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: supabaseError } = await supabase
        .from('course_comments')
        .insert({
          course_code: courseCode,
          content: content,
          user_id: user.id,
          parent_id: parentId
        });
        
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Reset states after successful submission
      setReplyingTo(null);
    } catch (error: unknown) {
      console.error('Error posting reply:', error);
      setError('Failed to post your reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to recursively remove a comment and its replies
  const removeCommentFromState = (commentId: string, commentsArray: CommentWithReplies[]): CommentWithReplies[] => {
    // First, check if the comment is at this level
    const filtered = commentsArray.filter(comment => comment.id !== commentId);
    
    // Then, recursively check each comment's replies
    return filtered.map(comment => {
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: removeCommentFromState(commentId, comment.replies)
        };
      }
      return comment;
    });
  };

  const handleDeleteComment = async (commentId: string, isUserComment: boolean) => {
    if (!user) return;
    
    if (!isUserComment && !isAdmin) {
      setError('You do not have permission to delete this comment.');
      return;
    }

    // Add this comment ID to the deleting state
    setDeletingComments(prev => [...prev, commentId]);
    
    try {
      // For admin deleting someone else's comment
      if (isAdmin && !isUserComment) {
        const { error: adminDeleteError } = await supabase
          .from('course_comments')
          .delete()
          .eq('id', commentId)
          .eq('course_code', courseCode);
          
        if (adminDeleteError) {
          throw adminDeleteError;
        }
      } 
      // For regular users or admins deleting their own comments
      else {
        const { error: userDeleteError } = await supabase
          .from('course_comments')
          .delete()
          .eq('id', commentId)
          .eq('user_id', user.id)
          .eq('course_code', courseCode);
          
        if (userDeleteError) {
          throw userDeleteError;
        }
      }
      
      // Update the UI immediately without waiting for the real-time subscription
      setComments(prev => removeCommentFromState(commentId, prev));
      
      console.log('Comment deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    } finally {
      // Remove this comment ID from the deleting state
      setDeletingComments(prev => prev.filter(id => id !== commentId));
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch {
      return dateString
    }
  }
  
  const getUserName = (comment: Comment) => {
    if (comment.user?.full_name) {
      return comment.user.full_name
    }
    
    if (comment.user?.email) {
      return comment.user.email.split('@')[0]
    }
    
    return 'Anonymous'
  }

  const getAvatarUrl = (comment: Comment) => {
    return comment.user?.avatar_url || null
  }

  // Component to render a single comment with its replies
  const CommentItem = ({ comment, isReply = false }: { comment: CommentWithReplies, isReply?: boolean }) => {
    return (
      <div 
        className={`comment-item ${isReply ? 'comment-reply' : ''}`}
      >
        <div className="comment-header">
          <div className="comment-avatar">
            {getAvatarUrl(comment) ? (
              <Image 
                src={getAvatarUrl(comment)!} 
                alt={`${getUserName(comment)}'s avatar`}
                width={32}
                height={32}
                className="avatar-image"
              />
            ) : (
              <span className="avatar-fallback">
                {getUserName(comment).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="comment-meta">
            <div className="comment-author">
              {getUserName(comment)}
              {isAdmin && comment.user_id === user?.id && " (Admin)"}
            </div>
            <div className="comment-date">{formatDate(comment.created_at)}</div>
          </div>
          {user && (comment.user_id === user.id || isAdmin) && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                handleDeleteComment(comment.id, comment.user_id === user.id);
              }}
              className={`comment-delete ${!isAdmin && comment.user_id !== user.id ? 'hidden' : ''} ${isAdmin && comment.user_id !== user.id ? 'admin-delete' : ''} ${deletingComments.includes(comment.id) ? 'deleting' : ''}`}
              aria-label="Delete comment"
              title={isAdmin && comment.user_id !== user.id ? "Delete as admin" : "Delete your comment"}
              disabled={deletingComments.includes(comment.id)}
            >
              {deletingComments.includes(comment.id) ? '...' : '×'}
            </button>
          )}
        </div>
        <div className="comment-content">{comment.content}</div>
        
        {/* Reply button - now available on all comments, not just top-level ones */}
        {user && (
          <div className="comment-actions">
            <button 
              onClick={() => {
                // Only set replyingTo if we're not already replying to this comment
                if (replyingTo !== comment.id) {
                  setReplyingTo(comment.id);
                }
              }}
              className="reply-button"
              style={{ display: replyingTo === comment.id ? 'none' : 'flex' }}
            >
              <ArrowUturnLeftIcon className="reply-icon" />
              Reply
            </button>
          </div>
        )}
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <ReplyForm 
            commentId={comment.id}
            onSubmit={handleSubmitReply}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-container">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Separate Reply Form component to better isolate its functionality
  const ReplyForm = ({ 
    commentId, 
    onSubmit, 
    onCancel 
  }: { 
    commentId: string, 
    onSubmit: (e: React.FormEvent, commentId: string) => Promise<void>,
    onCancel: () => void
  }) => {
    // Use local state only, not tied to parent state
    const [localReplyContent, setLocalReplyContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Focus the textarea when the component mounts
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, []);
    
    // Handle the form submission
    const handleLocalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Pass the local content to the parent's onSubmit
      // We'll update the parent's replyContent in handleSubmitReply
      onSubmit(e, commentId);
      // We don't need to clear localReplyContent here as the component will unmount on success
    };
    
    return (
      <form 
        onSubmit={handleLocalSubmit} 
        className="reply-form"
        onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
      >
        <textarea
          ref={textareaRef}
          value={localReplyContent}
          onChange={(e) => setLocalReplyContent(e.target.value)}
          placeholder="Write your reply..."
          className="reply-input"
          disabled={isSubmitting}
        />
        <div className="reply-form-footer">
          <button
            type="button" 
            onClick={onCancel}
            className="reply-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`reply-submit ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !localReplyContent.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="comments-section">
      <h3 className="section-title">Comments & Discussion</h3>
      
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts or ask a question..."
          className="comment-input"
          disabled={isSubmitting || !user}
        />
        <div className="comment-form-footer">
          {error && <p className="comment-error">{error}</p>}
          <button
            type="submit"
            className={`comment-submit ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !newComment.trim() || !user}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
      
      <div className="comments-list">
        {isLoading ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            No comments yet. Be the first to start a discussion!
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
} 