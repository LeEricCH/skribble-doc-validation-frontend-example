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
import validationStorage from '@/utils/validationStorage'

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
    timestamp: string
  }
  onDocumentClick?: (docId: string) => void
  resultIndex?: number | null
}

// Document Selection Component
function DocumentSelectionSidebar({
  results,
  activeIndex,
  settings,
  onDocumentSelect
}: {
  results: (ValidationResponse & { originalFile?: string; error?: string | null })[]
  activeIndex: number
  settings?: ValidationOptions
  onDocumentSelect: (index: number) => void
}) {
  const t = useTranslations('ValidationResults')
  
  return (
    <div className="document-selection-sidebar">
      <div className="sidebar-header">
        <h3>{t('documentResults')}</h3>
      </div>
      
      <div className="document-tabs">
        {results.map((result, index) => {
          const status = getValidationStatus(result, settings);
          
          return (
            <button
              key={result.id || `result-${index}`}
              className={`document-tab${activeIndex === index ? ` active status-${status}` : ''}`}
              onClick={() => onDocumentSelect(index)}
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
      
      <style jsx>{`
        .document-selection-sidebar {
          position: fixed;
          right: 1rem;
          top: 15%;
          width: 280px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          z-index: 100;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          background: #f8f8f8;
          border-radius: 8px 8px 0 0;
        }
        
        .sidebar-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .document-tabs {
          overflow-y: auto;
          flex: 1;
          max-height: calc(70vh - 50px);
        }
        
        .document-tab {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
          width: 100%;
        }
        
        .document-tab:hover {
          background-color: #f9f9f9;
        }
        
        .document-tab.active {
          background-color: #f5f5f5;
          border-left: 3px solid transparent;
        }
        
        .document-tab.active.status-valid {
          border-left: 3px solid #10b981;
        }
        
        .document-tab.active.status-invalid {
          border-left: 3px solid #e74c3c;
        }
        
        .document-tab.active.status-requirementsNotMet {
          border-left: 3px solid #f59e0b;
        }
        
        .tab-icon {
          margin-right: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tab-content {
          flex: 1;
          min-width: 0;
        }
        
        .tab-filename {
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tab-status {
          font-size: 0.85rem;
          color: #666;
        }
        
        .tab-indicator {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .document-tab.active .tab-indicator {
          opacity: 1;
        }
        
        .valid-icon {
          color: #10b981;
        }
        
        .invalid-icon {
          color: #ef4444;
        }
        
        .error-icon {
          color: #f59e0b;
        }
        
        .requirements-icon {
          color: #f59e0b;
        }
        
        @media (max-width: 1200px) {
          .document-selection-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function BatchValidationResults({ 
  results, 
  batchInfo,
  resultIndex
}: BatchValidationProps) {
  const t = useTranslations('ValidationResults')
  const [activeTabIndex, setActiveTabIndex] = useState(resultIndex || 0)
  const [activeDocumentSigners, setActiveDocumentSigners] = useState<SignerInfo[] | null>(null)
  const [isLoadingActiveSigners, setIsLoadingActiveSigners] = useState(false)
  
  // Get signers

  // Function to fetch signers for a document by ID
  const fetchSignersForDocument = useCallback((documentId: string | undefined) => {
    if (!documentId) return
    
    setIsLoadingActiveSigners(true)
    try {
      const signers = validationStorage.getSigners(documentId)
      setActiveDocumentSigners(signers)
    } catch (err) {
      console.error('Error getting signer info:', err)
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
  
  // Update active tab when resultIndex prop changes
  useEffect(() => {
    if (resultIndex !== null && resultIndex !== undefined && resultIndex >= 0 && resultIndex < results.length) {
      setActiveTabIndex(resultIndex);
    }
  }, [resultIndex, results.length]);
  
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
      timestamp: batchInfo.timestamp,
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
      
      {/* Document Tabs Navigation - Visible on smaller screens only */}
      <div className="document-tabs-container mobile-only">
        <div className="document-tabs-header">
          <h3>{t('documentResults')}</h3>
        </div>
        
        <div className="document-tabs">
          {results.map((result, index) => {
            const status = getValidationStatus(result, batchInfo.settings);
            
            return (
              <button
                key={result.id || `result-${index}`}
                className={`document-tab${activeTabIndex === index ? ` active status-${status}` : ''}`}
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
      
      {/* Floating document selection sidebar - only visible on larger screens */}
      <DocumentSelectionSidebar 
        results={results}
        activeIndex={activeTabIndex}
        settings={batchInfo.settings}
        onDocumentSelect={handleTabClick}
      />
      
      <style jsx global>{`
        .batch-validation-container {
          position: relative;
        }
        
        .mobile-only {
          display: none;
        }
        
        @media (max-width: 1200px) {
          .mobile-only {
            display: block;
          }
        }
      `}</style>
    </div>
  )
} 