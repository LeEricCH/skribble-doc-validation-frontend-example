'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileCheck, 
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import type { ValidationResponse, ValidationOptions, SignerInfo } from '@/types/validation'
import ValidationResults from './ValidationResults'
import type { ValidationDisplayData } from './ValidationResults'
import { getValidationStatus } from '@/utils/validationUtils'

interface BatchSummary {
  totalFiles: number
  validFiles: number
  invalidFiles: number
  errorFiles: number
}

interface BatchValidationProps {
  results: (ValidationResponse & { originalFile?: string; error?: string | null })[]
  batchInfo: {
    summary: BatchSummary
    settings?: ValidationOptions | undefined
  }
  onDocumentClick?: (docId: string) => void
}

export default function BatchValidationResults({ 
  results, 
  batchInfo,
}: BatchValidationProps) {
  const t = useTranslations('ValidationResults')
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [activeDocumentSigners, setActiveDocumentSigners] = useState<SignerInfo[] | null>(null)
  const [isLoadingActiveSigners, setIsLoadingActiveSigners] = useState(false)
  
  // Function to fetch signers for a document by ID
  const fetchSignersForDocument = useCallback(async (documentId: string | undefined) => {
    if (!documentId) return
    
    setIsLoadingActiveSigners(true)
    try {
      const response = await fetch(`/api/signers/${documentId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch signer info: ${response.status}`)
      }
      
      const data = await response.json()
      setActiveDocumentSigners(data)
    } catch (err) {
      console.error('Error fetching signer info:', err)
      setActiveDocumentSigners(null)
    } finally {
      setIsLoadingActiveSigners(false)
    }
  }, [])
  
  // Fetch signers when active tab changes
  useEffect(() => {
    const activeDocument = results[activeTabIndex]
    if (activeDocument?.id && !activeDocument.error) {
      fetchSignersForDocument(activeDocument.id)
    } else {
      setActiveDocumentSigners(null)
    }
  }, [activeTabIndex, results, fetchSignersForDocument])
  
  if (!results || results.length === 0) {
    return (
      <div className="validation-error">
        <AlertTriangle size={48} className="error-icon" />
        <h3>{t('noResults')}</h3>
        <p>{t('noResultsDescription')}</p>
      </div>
    )
  }
  
  const { summary } = batchInfo
  
  // Map ValidationResponse to ValidationDisplayData for active result
  const mapToDisplayData = (result: ValidationResponse & { originalFile?: string; size?: number }): ValidationDisplayData => {
    return {
      id: result.id,
      valid: result.valid,
      filename: result.originalFile || result.filename || 'Unknown',
      size: result.size || 0,
      timestamp: new Date().toISOString(),
      totalSignatures: result.signatures,
      validSignatures: result.validSignatures,
      quality: result.quality,
      legislation: result.legislation,
      longTermValidation: result.longTermValidation,
      visualDifferences: result.visualDifferences,
      undefinedChanges: result.undefinedChanges,
      // Add settings from batch
      settingsQuality: batchInfo.settings?.quality,
      settingsLegislation: batchInfo.settings?.legislation,
      settingsLongTermValidation: batchInfo.settings?.longTermValidation,
      settingsRejectVisualDifferences: batchInfo.settings?.rejectVisualDifferences,
      settingsRejectUndefinedChanges: batchInfo.settings?.rejectUndefinedChanges
    };
  };
  
  const handleTabClick = (index: number) => {
    setActiveTabIndex(index)
  }
  
  return (
    <div className="batch-validation-container">
      {/* Batch Summary Card */}
      <div className="batch-summary-card">
        <div className="batch-summary-header">
          <FileCheck size={24} />
          <h2>{t('batchSummaryTitle')}</h2>
        </div>
        
        <div className="batch-summary-content">
          <div className="batch-stats-grid">
            <div className="batch-stat-item">
              <div className="stat-value">{summary.totalFiles}</div>
              <div className="stat-label">{t('totalDocuments')}</div>
            </div>
            
            <div className="batch-stat-item valid">
              <div className="stat-value">
                <CheckCircle size={16} />
                {summary.validFiles}
              </div>
              <div className="stat-label">{t('validDocuments')}</div>
            </div>
            
            <div className="batch-stat-item invalid">
              <div className="stat-value">
                <XCircle size={16} />
                {summary.invalidFiles}
              </div>
              <div className="stat-label">{t('invalidDocuments')}</div>
            </div>
            
            {summary.errorFiles > 0 && (
              <div className="batch-stat-item error">
                <div className="stat-value">
                  <AlertTriangle size={16} />
                  {summary.errorFiles}
                </div>
                <div className="stat-label">{t('errorDocuments')}</div>
              </div>
            )}
          </div>
          
          <div className="batch-summary-footer">
            <div className="batch-success-rate">
              <div className="success-rate-label">{t('successRate')}</div>
              <div className="success-rate-value">
                {summary.totalFiles > 0 
                  ? `${Math.round((summary.validFiles / summary.totalFiles) * 100)}%` 
                  : '0%'}
              </div>
            </div>
    
          </div>
        </div>
      </div>
      
      {/* Document Tabs Navigation */}
      <div className="document-tabs-container">
        <div className="document-tabs-header">
          <h3>{t('documentResults')}</h3>
        </div>
        
        <div className="document-tabs">
          {results.map((result, index) => {
            const status = getValidationStatus(result, batchInfo.settings);
            
            return (
              <button
                key={result.id || `result-${index}`}
                className={`document-tab ${activeTabIndex === index ? 'active' : ''}`}
                onClick={() => handleTabClick(index)}
                type="button"
              >
                <div className="tab-icon">
                  {result.error ? (
                    <AlertTriangle size={16} className="error-icon" />
                  ) : result.valid ? (
                    <CheckCircle size={16} className="valid-icon" />
                  ) : status === 'requirementsNotMet' ? (
                    <AlertCircle size={16} className="requirements-icon" />
                  ) : (
                    <XCircle size={16} className="invalid-icon" />
                  )}
                </div>
                <div className="tab-content">
                  <div className="tab-filename" title={result.originalFile || result.filename || `Document ${index + 1}`}>
                    {result.originalFile || result.filename || `Document ${index + 1}`}
                  </div>
                  <div className="tab-status">
                    {result.error 
                      ? t('processingError')
                      : status === 'valid'
                        ? t('valid') 
                        : status === 'requirementsNotMet'
                          ? t('requirementsNotMet')
                          : t('invalid')}
                  </div>
                </div>
                <ChevronRight size={16} className="tab-indicator" />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Active Document Validation Result */}
      <div className="active-document-result">
        {results[activeTabIndex].error ? (
          <div className="document-error-message">
            <AlertTriangle size={48} className="error-icon" />
            <h3>{t('validationError')}</h3>
            <p>{results[activeTabIndex].error}</p>
            <div className="error-filename">
              {t('file')}: {results[activeTabIndex].originalFile || t('unknown')}
            </div>
          </div>
        ) : (
          <ValidationResults 
            validation={mapToDisplayData(results[activeTabIndex])} 
            signerInfo={activeDocumentSigners}
            isLoadingSigners={isLoadingActiveSigners}
          />
        )}
      </div>
    </div>
  )
} 