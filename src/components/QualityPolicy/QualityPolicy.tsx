/**
 * Quality Policy Component
 * 
 * This client-side component displays the institution's quality policy document,
 * allowing users to view the most recent active policy version. It provides a
 * clean interface for accessing important institutional documentation.
 * 
 * Key features:
 * - Fetches the latest active quality policy from Supabase
 * - Displays policy metadata (title, version, last updated)
 * - Provides an embedded PDF viewer for the policy document
 * - Handles loading and error states appropriately
 * 
 * The component integrates with the application's theme system through CSS classes
 * defined in QualityPolicy.css that adapt to both light and dark modes based on the
 * root element's theme class. This prevents theme flashing during navigation by using
 * :root.dark and :root:not(.dark) selectors rather than hardcoded color values in the JSX.
 */

'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import './QualityPolicy.css'
import { supabase } from '@/lib/supabase'

/**
 * Quality Policy Data Interface
 * 
 * Defines the structure of quality policy data retrieved from Supabase.
 * 
 * @property id - Unique identifier for the policy document
 * @property title - Title of the quality policy document
 * @property pdf_url - URL to access the PDF document
 * @property last_updated - Date when the policy was last updated
 * @property version - Version number or identifier of the policy
 * @property active - Whether this policy is currently active
 */
interface QualityPolicyData {
  id: number
  title: string
  pdf_url: string
  last_updated: string
  version: string
  active: boolean
}

/**
 * Quality Policy Component
 * 
 * Displays the institution's quality policy document with an embedded PDF viewer.
 * This component fetches the most recent active policy from Supabase and provides
 * a user-friendly interface for viewing it.
 * 
 * The component uses CSS classes defined in QualityPolicy.css that adapt to the
 * application's theme system, supporting both light and dark modes through
 * :root.dark and :root:not(.dark) selectors. This ensures consistent visual
 * appearance across theme changes and prevents theme flashing during navigation.
 * 
 * @returns React component for displaying the quality policy
 */
export default function QualityPolicy() {
  // State for controlling PDF viewer visibility
  const [showPdf, setShowPdf] = useState(false)
  
  // State for storing policy data and handling loading/error states
  const [policyData, setPolicyData] = useState<QualityPolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch Quality Policy Data
   * 
   * Retrieves the most recent active quality policy document from Supabase
   * when the component mounts. The query is designed to fetch only the latest
   * active policy to ensure users always see the most up-to-date information.
   * 
   * The function includes proper loading state management and error handling
   * to provide appropriate feedback to users in all scenarios.
   */
  useEffect(() => {
    const fetchQualityPolicy = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('quality_policies')
          .select('id, title, pdf_url, last_updated, version, active')
          .eq('active', true)  // Only fetch active policies
          .order('id', { ascending: false })  // Get the most recent one
          .limit(1)  // We only need one result
          .single()  // Expect a single result
        
        if (error) throw error
        
        setPolicyData(data)
      } catch (error) {
        console.error('Error fetching quality policy:', error)
        setError('Failed to load quality policy data')
      } finally {
        setLoading(false)
      }
    }

    fetchQualityPolicy()
  }, [])

  /**
   * Handle Opening PDF Viewer
   * 
   * Sets the showPdf state to true, displaying the PDF viewer modal
   * with the embedded policy document.
   */
  const handleOpenPdf = () => {
    setShowPdf(true)
  }

  /**
   * Handle Closing PDF Viewer
   * 
   * Sets the showPdf state to false, hiding the PDF viewer modal
   * and returning to the main quality policy view.
   */
  const handleClosePdf = () => {
    setShowPdf(false)
  }

  if (loading) {
    return (
      <div className="quality-policy-container">
        <div className="policy-loading">Loading quality policy document...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quality-policy-container">
        <div className="policy-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="quality-policy-container">
      <div className="policy-header">
        <h2 className="policy-title">{policyData?.title || 'Quality Policy'}</h2>
      </div>

      <div className="policy-document-container">
        <button 
          className="policy-download-link"
          onClick={handleOpenPdf}
          aria-label="View Quality Policy Document"
        >
          <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
          View Quality Policy Document
        </button>
      </div>

      {showPdf && (
        <div className="pdf-viewer-overlay">
          <div className="pdf-viewer-container">
            <div className="pdf-viewer-header">
              <h3>{policyData?.title || 'Quality Policy Document'}</h3>
              <button 
                className="pdf-close-button"
                onClick={handleClosePdf}
                aria-label="Close PDF viewer"
              >
                ×
              </button>
            </div>
            <div className="pdf-viewer-content">
              <iframe
                src={policyData?.pdf_url}
                title="Quality Policy Document"
                className="pdf-iframe"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 