/**
 * Report Material Dialog Component
 * 
 * This component provides a modal dialog interface for users to report inappropriate
 * or problematic course materials. It allows users to select a reason for reporting
 * and provide additional details about their concerns.
 * 
 * Key features:
 * - Animated modal dialog using Framer Motion
 * - Predefined report reason options
 * - Form validation
 * - API integration for submitting reports
 * - Success and error state handling with toast notifications
 * 
 * The component integrates with the application's theme system through conditional
 * CSS classes that adapt to both light and dark modes based on the root element's
 * theme class. This prevents theme flashing during navigation by using theme-aware
 * class names rather than hardcoded color values.
 */

import React, { useState } from 'react'
import { 
  FlagIcon, 
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Report Material Dialog Props Interface
 * 
 * Configuration options for the ReportMaterialDialog component.
 * 
 * @property materialId - Unique identifier for the material being reported
 * @property materialName - Display name of the material being reported
 * @property isOpen - Boolean to control the visibility of the dialog
 * @property onClose - Callback function to execute when the dialog is closed
 * @property onSuccess - Optional callback function to execute after a successful report submission
 */
interface ReportMaterialDialogProps {
  materialId: string
  materialName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Report Reasons Array
 * 
 * Predefined list of reasons for reporting course materials.
 * Each reason has an ID (used as the form value) and a display label.
 * The 'other' option allows users to provide custom reasons via the details field.
 */
const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'copyright', label: 'Copyright violation' },
  { id: 'outdated', label: 'Outdated or incorrect information' },
  { id: 'duplicate', label: 'Duplicate material' },
  { id: 'quality', label: 'Poor quality or unreadable' },
  { id: 'other', label: 'Other (please specify)' }
]

/**
 * Report Material Dialog Component
 * 
 * A modal dialog that allows users to report problematic course materials.
 * This component handles the entire reporting process including form display,
 * validation, submission to the server, and success/error feedback.
 * 
 * The component uses conditional CSS classes (dark: prefixed classes) that adapt to the
 * application's theme system, supporting both light and dark modes through the root
 * element's theme class. This ensures consistent visual appearance across theme changes
 * and prevents theme flashing during navigation.
 * 
 * @param materialId - ID of the material being reported
 * @param materialName - Name of the material being reported
 * @param isOpen - Whether the dialog is visible
 * @param onClose - Function to call when the dialog is closed
 * @param onSuccess - Optional function to call after successful submission
 * @returns React component for reporting course materials
 */
export default function ReportMaterialDialog({ 
  materialId, 
  materialName,
  isOpen, 
  onClose,
  onSuccess 
}: ReportMaterialDialogProps) {
  // Form state management
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get current user from authentication context
  const { user } = useAuth()

  /**
   * Handle Reason Selection Change
   * 
   * Updates the selectedReason state when the user selects a different radio button.
   * 
   * @param e - The change event from the radio input
   */
  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedReason(e.target.value)
  }

  /**
   * Handle Details Text Change
   * 
   * Updates the details state when the user types in the textarea.
   * 
   * @param e - The change event from the textarea
   */
  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(e.target.value)
  }

  /**
   * Reset Form State
   * 
   * Resets all form fields and error state to their initial values.
   * Used when closing the dialog or after successful submission.
   */
  const resetForm = () => {
    setSelectedReason('')
    setDetails('')
    setError(null)
  }

  /**
   * Handle Dialog Close
   * 
   * Resets the form and calls the onClose callback to close the dialog.
   */
  const handleClose = () => {
    resetForm()
    onClose()
  }

  /**
   * Handle Form Submission
   * 
   * Validates the form inputs, submits the report to the server,
   * and handles success and error states.
   * 
   * The function performs the following steps:
   * 1. Validates that a reason is selected
   * 2. For 'other' reason, validates that details are provided
   * 3. Submits the report data to the API
   * 4. Handles various error responses with appropriate messages
   * 5. On success, shows a toast notification and closes the dialog
   * 
   * @param e - The form submission event
   */
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
      const response = await fetch('/api/courses/materials/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          materialId,
          reason: selectedReason,
          details: details.trim() || null
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to report course material')
        } else if (response.status === 400 && data.error === 'You have already reported this material') {
          throw new Error('You have already reported this material')
        } else if (response.status === 404) {
          throw new Error('The material you are trying to report could not be found')
        } else {
          throw new Error(data.error || 'Failed to submit report')
        }
      }

      // Handle success
      toast.success('Material reported successfully')
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
                  <h3 id="report-dialog-title" className="text-lg font-bold dark:text-white text-gray-800">Report Course Material</h3>
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
                <div className="mb-4">
                  <h4 className="font-medium dark:text-white text-gray-800 mb-2">Material:</h4>
                  <p className="text-sm dark:text-gray-300 text-gray-600 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                    {materialName}
                  </p>
                </div>
                
                <div className="mb-6">
                  <p className="dark:text-gray-300 text-gray-600 mb-4">
                    Please select a reason for reporting this material:
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