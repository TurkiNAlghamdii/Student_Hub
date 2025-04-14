'use client'

import { useEffect, useState } from 'react'
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
  const [policyData, setPolicyData] = useState<QualityPolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQualityPolicy = async () => {
      try {
        setLoading(true)
        
        const { data, error: fetchError } = await supabase
          .from('quality_policies')
          .select('id, title, pdf_url, last_updated, version, active')
          .eq('active', true)
          .order('id', { ascending: false })
          .limit(1)
          .single()
        
        if (fetchError) throw fetchError
        
        setPolicyData(data)
      } catch (fetchError) {
        console.error('Error fetching quality policy:', fetchError)
        setError('Failed to load quality policy data')
      } finally {
        setLoading(false)
      }
    }

    fetchQualityPolicy()
  }, [])

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

  if (!policyData?.pdf_url) {
    return (
      <div className="quality-policy-container">
        <div className="policy-error">No policy document available</div>
      </div>
    )
  }

  return (
    <div className="quality-policy-container">
      <div className="policy-header">
        <h2 className="policy-title">{policyData?.title || 'Quality Policy'}</h2>
      </div>

      <div className="pdf-container">
        <iframe
          src={policyData.pdf_url}
          title="Quality Policy Document"
          className="pdf-display"
          width="100%"
          height="800px"
          allowFullScreen
        />
      </div>
    </div>
  )
} 