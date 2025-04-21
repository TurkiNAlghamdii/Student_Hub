import React, { useState } from 'react'
import { 
  FlagIcon, 
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ReportCommentDialogProps {
  commentId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate_speech', label: 'Hate speech' },
  { id: 'misinformation', label: 'False or misleading information' },
  { id: 'other', label: 'Other (please specify)' }
]

export default function ReportCommentDialog({ 
  commentId, 
  isOpen, 
  onClose,
  onSuccess 
}: ReportCommentDialogProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedReason(e.target.value)
  }

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(e.target.value)
  }

  const resetForm = () => {
    setSelectedReason('')
    setDetails('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate inputs
    if (!selectedReason) {
      setError('Please select a reason for reporting')
      return
    }

    if (selectedReason === 'other' && !details.trim()) {
      setError('Please provide details for your report')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          commentId,
          reason: selectedReason,
          details: details.trim() || null
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to report a comment')
        } else if (response.status === 400 && data.error === 'You have already reported this comment') {
          throw new Error('You have already reported this comment')
        } else if (response.status === 404) {
          throw new Error('The comment you are trying to report could not be found')
        } else {
          throw new Error(data.error || 'Failed to submit report')
        }
      }

      // Handle success
      toast.success('Comment reported successfully')
      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
            role="presentation"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
          >
            <div className="w-full max-w-md dark:bg-gray-900 bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="dark:bg-gray-800 bg-gray-100 py-4 px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FlagIcon className="h-5 w-5 dark:text-red-400 text-red-500" aria-hidden="true" />
                  <h3 id="report-dialog-title" className="text-lg font-bold dark:text-white text-gray-800">Report Comment</h3>
                </div>
                <button 
                  onClick={handleClose}
                  className="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-black transition-colors"
                  aria-label="Close dialog"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <p className="dark:text-gray-300 text-gray-600 mb-4">
                    Please select a reason for reporting this comment:
                  </p>

                  <div className="space-y-2" role="radiogroup" aria-labelledby="report-reason-group">
                    <div id="report-reason-group" className="sr-only">Report reason</div>
                    {REPORT_REASONS.map((reason) => (
                      <div key={reason.id} className="flex items-start">
                        <input
                          type="radio"
                          id={reason.id}
                          name="reportReason"
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={handleReasonChange}
                          className="mt-1 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300 text-emerald-500 focus:ring-emerald-500"
                          aria-describedby={selectedReason === 'other' ? 'details-label' : undefined}
                        />
                        <label
                          htmlFor={reason.id}
                          className="ml-2 block dark:text-gray-300 text-gray-700"
                        >
                          {reason.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label id="details-label" htmlFor="details" className="block mb-2 dark:text-gray-300 text-gray-700">
                    Additional details {selectedReason === 'other' ? '(required)' : '(optional)'}:
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={3}
                    value={details}
                    onChange={handleDetailsChange}
                    className="w-full px-3 py-2 rounded-lg dark:bg-gray-800 bg-gray-50 dark:border-gray-700 border-gray-300 dark:text-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Please provide any additional context or details about this report..."
                    aria-invalid={selectedReason === 'other' && !details.trim() ? 'true' : 'false'}
                    aria-required={selectedReason === 'other'}
                  ></textarea>
                </div>

                {error && (
                  <div 
                    className="mb-4 p-3 rounded-lg dark:bg-red-900/30 bg-red-100 dark:text-red-400 text-red-700 dark:border-red-800 border-red-300 border flex items-start gap-2"
                    role="alert"
                    aria-live="assertive"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg dark:bg-gray-800 bg-gray-200 dark:text-gray-300 text-gray-700 hover:dark:bg-gray-700 hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-500"
                    aria-label="Cancel report submission"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    aria-busy={isSubmitting}
                    aria-disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" aria-hidden="true"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FlagIcon className="h-4 w-4" aria-hidden="true" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 