'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'
import { 
  ArrowUturnLeftIcon, 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
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
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  // Function to close any open menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpenFor !== null) {
        const menuElement = document.getElementById(`menu-${menuOpenFor}`);
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setMenuOpenFor(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenFor]);

  // Check if current user is an admin
  useEffect(() => {
    if (user) {
      setIsAdmin(user.app_metadata?.is_admin === true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Add useEffect to detect mobile screen size and auto-collapse deeply nested threads
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Modify the useEffect to populate all comments with replies into collapsedThreads initially
  useEffect(() => {
    if (comments.length > 0) {
      // Function to collect all comment IDs that have replies
      const collectCommentIdsWithReplies = (comments: CommentWithReplies[]): string[] => {
        let ids: string[] = [];
        
        comments.forEach(comment => {
          if (comment.replies && comment.replies.length > 0) {
            ids.push(comment.id);
            // Also collect IDs from nested replies that have their own replies
            ids = [...ids, ...collectCommentIdsWithReplies(comment.replies)];
          }
        });
        
        return ids;
      };
      
      // Get all comment IDs with replies
      const commentIdsWithReplies = collectCommentIdsWithReplies(comments);
      
      // Set all threads to collapsed by default
      setCollapsedThreads(new Set(commentIdsWithReplies));
    }
  }, [comments]);

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
        if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
          // When a comment is inserted or deleted, fetch all comments to correctly organize the hierarchy
          const fetchAllComments = async () => {
            try {
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
            } catch (error) {
              console.error('Error fetching comments after update:', error)
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
      
      setNewComment('') // Clear the input field on success
    } catch (error: unknown) {
      console.error('Error posting comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to post comment: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSubmitReply = async (e: React.FormEvent, parentId: string, replyContent: string) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to post a reply')
      return
    }
    
    if (!replyContent.trim()) {
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const { error: supabaseError } = await supabase
        .from('course_comments')
        .insert({
          course_code: courseCode,
          content: replyContent.trim(),
          user_id: user.id,
          parent_id: parentId
        })
        
      if (supabaseError) {
        throw supabaseError
      }
      
      // Clear the reply state
      setReplyingTo(null)
    } catch (error: unknown) {
      console.error('Error posting reply:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to post reply: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const removeCommentFromState = (commentId: string, commentsArray: CommentWithReplies[]): CommentWithReplies[] => {
    return commentsArray.filter(comment => {
      if (comment.id === commentId) {
        return false;
      }
      
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeCommentFromState(commentId, comment.replies);
      }
      
      return true;
    });
  };
  
  const handleDeleteComment = async (commentId: string, isUserComment: boolean) => {
    if (!user) return
    
    // Only admins or the user who posted the comment can delete it
    if (!isAdmin && !isUserComment) return
    
    // Add to the list of comments being deleted
    setDeletingComments(prev => [...prev, commentId])
    
    try {
      const { error: supabaseError } = await supabase
        .from('course_comments')
        .delete()
        .eq('id', commentId)
        // Only admins can delete other users' comments
        .match(isAdmin ? {} : { user_id: user.id })
      
      if (supabaseError) {
        throw supabaseError
      }
      
      // Optimistically update state immediately
      setComments(prev => removeCommentFromState(commentId, [...prev]))
      
      // Close menu if it was open for this comment
      if (menuOpenFor === commentId) {
        setMenuOpenFor(null)
      }
    } catch (error: unknown) {
      console.error('Error deleting comment:', error)
      // You may want to show an error message here
    } finally {
      // Remove from the deleting list
      setDeletingComments(prev => prev.filter(id => id !== commentId))
    }
  }
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch (e) {
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
  
  // Add this function to toggle thread collapse state
  const toggleThreadCollapse = (commentId: string) => {
    setCollapsedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };
  
  // Add this function to count replies including nested ones
  const countAllReplies = (comment: CommentWithReplies): number => {
    if (!comment.replies || comment.replies.length === 0) {
      return 0;
    }
    
    let count = comment.replies.length;
    for (const reply of comment.replies) {
      count += countAllReplies(reply);
    }
    return count;
  };

  // Component to render a single comment with its replies
  const CommentItem = ({ 
    comment, 
    replies, 
    onReply, 
    onDelete, 
    nestingLevel = 0 
  }: { 
    comment: CommentWithReplies, 
    replies: CommentWithReplies[],
    onReply: (parentId: string) => void,
    onDelete: (id: string) => void,
    nestingLevel?: number
  }) => {
    const isAuthor = user && comment.user_id === user.id
    const canDelete = isAdmin || isAuthor
    const isDeleting: boolean = Boolean(deletingComments.includes(comment.id))
    const isMenuOpen = menuOpenFor === comment.id
    const hasReplies = replies && replies.length > 0
    const isThreadCollapsed = collapsedThreads.has(comment.id)
    const repliesCount = hasReplies ? countAllReplies(comment) : 0
    
    return (
      <div 
        className={`comment-item ${isThreadCollapsed ? 'thread-collapsed' : ''} nesting-level-${nestingLevel}`}
      >
        <div className="comment-header">
          <div className="comment-avatar">
            {getAvatarUrl(comment) ? (
              <Image 
                src={getAvatarUrl(comment)!} 
                alt={`${getUserName(comment)}'s avatar`}
                width={40}
                height={40}
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
              {isAdmin && comment.user_id === user?.id && (
                <span className="author-badge">Admin</span>
              )}
            </div>
            <div className="comment-date">
              <ClockIcon className="h-3 w-3 inline-block mr-1 text-gray-400" />
              {formatDate(comment.created_at)}
            </div>
          </div>
          
          {canDelete && (
            <div className="comment-actions-menu" id={`menu-${comment.id}`}>
              <button 
                className="comment-menu-button"
                onClick={() => {
                  if (isMenuOpen) {
                    setMenuOpenFor(null);
                  } else {
                    setMenuOpenFor(comment.id);
                  }
                }}
                disabled={Boolean(isDeleting)}
                aria-label="Comment options"
              >
                {isDeleting ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <EllipsisVerticalIcon className="h-5 w-5" />
                )}
              </button>
              
              {isMenuOpen && (
                <div className="comment-menu">
                  <button
                    onClick={() => onDelete(comment.id)}
                    className={`comment-menu-item ${!isAdmin && isAuthor ? 'delete' : 'admin-delete'}`}
                    disabled={isDeleting}
                  >
                    <TrashIcon className="menu-icon" />
                    {isAdmin && !isAuthor ? "Delete as Admin" : "Delete Comment"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="comment-content">{comment.content}</div>
        
        <div className="comment-actions">
          {/* Reply button - only show if user is logged in */}
          {user && (
            <button 
              onClick={() => {
                if (replyingTo === comment.id) {
                  setReplyingTo(null);
                } else {
                  setReplyingTo(comment.id);
                }
              }}
              className="reply-button"
            >
              <ArrowUturnLeftIcon className="reply-icon" />
              Reply
            </button>
          )}
          
          {/* Thread collapse button - only show if there are replies */}
          {hasReplies && (
            <button 
              onClick={() => toggleThreadCollapse(comment.id)}
              className="thread-toggle-button"
              aria-label={isThreadCollapsed ? "Expand replies" : "Collapse replies"}
            >
              {isThreadCollapsed ? (
                <>
                  <ChevronDownIcon className="thread-toggle-icon" />
                  <span>{repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}</span>
                </>
              ) : (
                <>
                  <ChevronUpIcon className="thread-toggle-icon" />
                  <span>Hide</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <ReplyForm 
            commentId={comment.id}
            onSubmit={handleSubmitReply}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        
        {/* Replies - now with nesting level tracking */}
        {hasReplies && !isThreadCollapsed && (
          <div className="replies-container">
            {replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                replies={reply.replies || []}
                onReply={onReply}
                onDelete={onDelete}
                nestingLevel={nestingLevel + 1} 
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Separate Reply Form component
  const ReplyForm = ({ 
    commentId, 
    onSubmit, 
    onCancel 
  }: { 
    commentId: string, 
    onSubmit: (e: React.FormEvent, commentId: string, replyContent: string) => Promise<void>,
    onCancel: () => void
  }) => {
    const [replyContent, setReplyContent] = useState('');
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
      onSubmit(e, commentId, replyContent);
    };
    
    return (
      <form 
        onSubmit={handleLocalSubmit} 
        className="reply-form"
      >
        <textarea
          ref={textareaRef}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write your reply..."
          className="reply-input"
          disabled={isSubmitting}
        />
        <div className="reply-form-footer">
          <button
            type="button" 
            onClick={onCancel}
            className="reply-cancel"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`reply-submit ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !replyContent.trim()}
          >
            {isSubmitting ? (
              ""
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4" />
                Post Reply
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  // Calculate total comments count (including replies)
  const getTotalCommentsCount = (comments: CommentWithReplies[]): number => {
    let count = comments.length;
    
    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        count += comment.replies.length;
      }
    }
    
    return count;
  };

  const totalCommentsCount = getTotalCommentsCount(comments);

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3 className="section-title">
          <ChatBubbleLeftRightIcon className="title-icon" />
          Comments & Discussion
          <span className="comments-count">{totalCommentsCount} {totalCommentsCount === 1 ? 'comment' : 'comments'}</span>
        </h3>
      </div>
      
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Share your thoughts or ask a question..." : "Please log in to join the discussion..."}
          className="comment-input"
          disabled={isSubmitting || !user}
        />
        <div className="comment-form-footer">
          {error && (
            <div className="comment-error">
              <ExclamationCircleIcon className="comment-error-icon" />
              {error}
            </div>
          )}
          <button
            type="submit"
            className={`comment-submit ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !newComment.trim() || !user}
          >
            {isSubmitting ? (
              ""
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="comments-list">
        {isLoading ? (
          <div className="comments-loading">
            <ArrowPathIcon className="loading-icon" />
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            <ChatBubbleLeftRightIcon className="empty-icon" />
            <h4 className="comments-empty-title">No comments yet</h4>
            <p className="comments-empty-description">
              Be the first to start a discussion about this course!
            </p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comment.replies || []}
              onReply={(parentId) => setReplyingTo(parentId)}
              onDelete={(id) => handleDeleteComment(id, Boolean(user && comment.user_id === user.id))}
              nestingLevel={0}
            />
          ))
        )}
      </div>
    </div>
  )
} 