'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import './QualityPolicy.css'
import { supabase } from '@/lib/supabase'

interface QualityPolicyData {
  id: number
  title: string
  pdf_url: string
  last_updated: string
  version: string
  active: boolean
}

export default function QualityPolicy() {
  const [showPdf, setShowPdf] = useState(false)
  const [policyData, setPolicyData] = useState<QualityPolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQualityPolicy = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('quality_policies')
          .select('id, title, pdf_url, last_updated, version, active')
          .eq('active', true)
          .order('id', { ascending: false })
          .limit(1)
          .single()
        
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

  const handleOpenPdf = () => {
    setShowPdf(true)
  }

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