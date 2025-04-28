'use client'

import { useRef, useState } from 'react'
import { 
  FileCheck, 
  Download, 
  User, 
  Calendar, 
  Award, 
  Globe,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { handleCertificateExport } from '@/utils/exportUtils'
import { getFailureReasons, isFailedDueToSettings, isHigherOrEqualQuality } from '@/utils/validationUtils'
import type { CertificateData } from '@/types/certificate'
import "@/styles/certificate.css"

interface CertificateViewProps {
  data: CertificateData
  onClose: () => void
}

export default function CertificateView({ data, onClose }: CertificateViewProps) {
  const certificateRef = useRef<HTMLDialogElement>(null)
  const certificateContentRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Certificate');
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  
  const {
    id: certificateId,
    timestamp: generationTime,
    validation,
    signers
  } = data
  
  const {
    id: validationId,
    valid,
    signatures,
    validSignatures,
    quality,
    legislation,
    longTermValidation,
    visualDifferences,
    undefinedChanges,
    timestamp: validationTime,
    filename,
    settings
  } = validation

  // Get translations for failure reasons
  const translations = {
    qualityRequirement: t('qualityRequirement'),
    legislationRequirement: t('legislationRequirement'),
    longTermValidationRequired: t('longTermValidationRequired'),
    visualDifferencesRejected: t('visualDifferencesRejected'),
    undefinedChangesRejected: t('undefinedChangesRejected'),
    actual: t('actual'),
    detected: t('detected'),
    notDetected: t('notDetected')
  }

  // Determine if the validation failure is only due to settings
  const failedDueToSettingsOnly = isFailedDueToSettings(
    valid,
    validSignatures,
    signatures,
    quality,
    legislation,
    longTermValidation,
    visualDifferences,
    undefinedChanges,
    settings
  )
  
  // Check if the API has already determined requirements not met status
  const showRequirementsNotMet = validation.requirementsNotMet || 
    (failedDueToSettingsOnly && validSignatures === signatures && signatures > 0)

  // Extract failure details from the validation response if settings are missing
  let failureDetails: string[] = [];
  if (validation.requirementsNotMet && validation.details && Array.isArray(validation.details)) {
    failureDetails = validation.details;
  }
  
  // Get failure reasons
  const failureReasons = getFailureReasons(
    quality,
    legislation,
    longTermValidation,
    visualDifferences,
    undefinedChanges,
    settings,
    translations
  )
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle keyboard event for modal close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!certificateContentRef.current) return
    
    setIsGenerating(true)
    setDropdownOpen(false)
    
    try {
      await handleCertificateExport(
        certificateContentRef.current,
        format,
        validationId
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div 
      className="certificate-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <dialog 
        className="certificate-container" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        ref={certificateRef}
        aria-modal="true"
        aria-labelledby="certificate-title"
        open
      >
        <div className="certificate-header">
          <h2 id="certificate-title">{t('title')}</h2>
          <div className="certificate-actions">
            <div className="dropdown-container">
              <button
                type="button"
                className="download-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={isGenerating}
              >
                <Download size={16} />
                <span>{isGenerating ? t('generating') : t('download')}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu" style={{ backgroundColor: 'white' }}>
                  <button 
                    type="button"
                    onClick={() => handleExport('pdf')}
                    className="dropdown-item"
                    style={{ color: 'rgba(0, 0, 0, 0.8)', backgroundColor: 'white' }}
                  >
                    {t('downloadPDF')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleExport('png')}
                    className="dropdown-item"
                    style={{ color: 'rgba(0, 0, 0, 0.8)', backgroundColor: 'white' }}
                  >
                    {t('downloadPNG')}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="close-button"
              onClick={onClose}
            >
              <XCircle size={20} />
              <span>{t('close')}</span>
            </button>
          </div>
        </div>

        <div className="certificate-body" ref={certificateContentRef}>
          <div className="certificate-title">
            <FileCheck size={40} color="#e74c3c" />
            <h1>{t('validatorName')}</h1>
          </div>
          
          <div className={`status-badge ${valid ? 'valid' : (showRequirementsNotMet ? 'requirements-not-met' : 'invalid')}`}>
            {valid 
              ? t('validDocument') 
              : (showRequirementsNotMet ? t('requirementsNotMet') : t('invalidDocument'))
            }
          </div>

          <div className="certificate-section">
            <h3>{t('validationInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">{t('validationID')}</span>
                <span className="info-value">{validationId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('fileName')}</span>
                <span className="info-value">{filename}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('validationDate')}</span>
                <span className="info-value">{formatDate(validationTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('totalSignatures')}</span>
                <span className="info-value">{signatures}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('validSignatures')}</span>
                <span className="info-value">
                  <span className={`status-text ${validSignatures === signatures ? 'valid' : 'invalid'}`}>
                    {validSignatures} / {signatures}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {!valid && showRequirementsNotMet && (failureReasons.length > 0 || failureDetails.length > 0) && (
            <div className="certificate-section failure-reasons">
              <h3>{t('failureReasons')}</h3>
              <ul className="reasons-list">
                {failureReasons.map((reason) => (
                  <li key={`reason-${Buffer.from(reason).toString('base64').substring(0, 10)}`} className="reason-item">
                    <div className="reason-icon">
                      <AlertTriangle size={14} />
                    </div>
                    <span>{reason}</span>
                  </li>
                ))}
                {/* Show details from API if no settings but API indicates requirements not met */}
                {failureReasons.length === 0 && failureDetails.map((detail, index) => {
                  // Try to map common English error messages to translation keys
                  let translatedDetail = detail;
                  
                  if (detail.includes('Signatures do not achieve the desired quality')) {
                    translatedDetail = t('apiErrors.qualityRequirement');
                  } else if (detail.includes('Signatures do not achieve the desired legislation')) {
                    translatedDetail = t('apiErrors.legislationRequirement');
                  } else if (detail.includes('Long-term validation is required')) {
                    translatedDetail = t('apiErrors.longTermValidationRequired');
                  } else if (detail.includes('Visual differences are not allowed')) {
                    translatedDetail = t('apiErrors.visualDifferencesRejected');
                  } else if (detail.includes('Undefined changes are not allowed')) {
                    translatedDetail = t('apiErrors.undefinedChangesRejected');
                  }
                  
                  return (
                    <li key={`api-detail-${index}-${Buffer.from(detail).toString('base64').substring(0, 8)}`} className="reason-item">
                      <div className="reason-icon">
                        <AlertTriangle size={14} />
                      </div>
                      <span>{translatedDetail}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(quality || legislation || longTermValidation !== undefined) && (
            <div className="certificate-section">
              <h3>{t('additionalInfo')}</h3>
              <div className="info-grid">
                {quality && (
                  <div className="info-item">
                    <span className="info-label">{t('signatureQuality')}</span>
                    <span className="info-value">
                      {quality}
                      {settings?.quality && (
                        <span className={`setting-requirement ${!isHigherOrEqualQuality(quality, settings.quality) ? 'not-met' : ''}`}>
                          ({t('required')}: {settings.quality})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {legislation && (
                  <div className="info-item">
                    <span className="info-label">{t('legislation')}</span>
                    <span className="info-value">
                      {legislation}
                      {settings?.legislation && (
                        <span className={`setting-requirement ${legislation !== settings.legislation ? 'not-met' : ''}`}>
                          ({t('required')}: {settings.legislation})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {longTermValidation !== undefined && (
                  <div className="info-item">
                    <span className="info-label">{t('longTermValidation')}</span>
                    <span className={`status-text ${longTermValidation ? 'valid' : 'invalid'}`}>
                      {longTermValidation ? t('yes') : t('no')}
                      {settings?.longTermValidation && !longTermValidation && (
                        <span className="setting-requirement not-met">
                          ({t('required')})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {visualDifferences !== undefined && (
                  <div className="info-item">
                    <span className="info-label">{t('visualDifferences')}</span>
                    <span className={`status-text ${!visualDifferences ? 'valid' : 'invalid'}`}>
                      {!visualDifferences ? t('noDetectedChanges') : t('detectedChanges')}
                      {settings?.rejectVisualDifferences && visualDifferences && (
                        <span className="setting-requirement not-met">
                          ({t('notAllowed')})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {undefinedChanges !== undefined && (
                  <div className="info-item">
                    <span className="info-label">{t('undefinedChanges')}</span>
                    <span className={`status-text ${!undefinedChanges ? 'valid' : 'invalid'}`}>
                      {!undefinedChanges ? t('noDetectedChanges') : t('detectedChanges')}
                      {settings?.rejectUndefinedChanges && undefinedChanges && (
                        <span className="setting-requirement not-met">
                          ({t('notAllowed')})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {signers && signers.length > 0 && (
            <div className="certificate-section">
              <h3>{t('signerInfo')}</h3>
              <div className="signers-list">
                {signers.map((signer, index) => (
                  <div key={`signer-cert-${signer.certificate.serialNumber}`} className="signer-card">
                    <div className="signer-header">
                      <div className="signer-icon">
                        <User size={20} color={signer.valid ? '#27ae60' : '#e74c3c'} />
                      </div>
                      <div className="signer-title">
                        <h4>
                          {signers.length > 1 ? `${t('signer')} ${index + 1}: ` : ''}
                          {signer.signer}
                        </h4>
                        <span className={`validation-status ${signer.valid ? 'valid' : 'invalid'}`}>
                          {signer.valid ? t('validSignature') : t('invalidSignature')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="signer-details">
                      <div className="detail-row">
                        <div className="detail-icon"><Calendar size={16} /></div>
                        <div className="detail-label">{t('signedOn')}</div>
                        <div className="detail-value">{formatDate(signer.time)}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-icon"><Award size={16} /></div>
                        <div className="detail-label">{t('signatureQuality')}</div>
                        <div className="detail-value">{signer.quality}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-icon"><Globe size={16} /></div>
                        <div className="detail-label">{t('legislation')}</div>
                        <div className="detail-value">{signer.legislation}</div>
                      </div>
                    </div>
                    
                    <div className="certificate-info">
                      <h5>{t('certificateDetails')}</h5>
                      <div className="cert-text">
                        <div className="cert-row">
                          <span className="cert-label">{t('subject')}</span> 
                          <span className="cert-value">{signer.certificate.subject}</span>
                        </div>
                        <div className="cert-row">
                          <span className="cert-label">{t('issuer')}</span> 
                          <span className="cert-value">{signer.certificate.issuer}</span>
                        </div>
                        <div className="cert-row">
                          <span className="cert-label">{t('serialNumber')}</span> 
                          <span className="cert-value">{signer.certificate.serialNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="certificate-footer">
            <p>{t('attestation')}</p>
            <p>{t('generatedOn')} {formatDate(generationTime)} {t('by')}</p>
            <p>{t('certificateID')} {certificateId}</p>
          </div>
        </div>
      </dialog>

      <style jsx>{`
        .certificate-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate-container {
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: 0;
          border: none;
          overflow: hidden;
        }
        
        .certificate-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #certificate-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .certificate-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .download-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background-color: #e74c3c;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }
        
        .close-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background-color: #ecf0f1;
          color: #7f8c8d;
          font-weight: 500;
          cursor: pointer;
        }
        
        .dropdown-container {
          position: relative;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 10;
          margin-top: 5px;
          min-width: 150px;
        }
        
        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.6rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .certificate-body {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          background-color: #f5f5f5;
        }
        
        .certificate-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .certificate-title h1 {
          margin: 1rem 0 0;
          font-size: 2rem;
          color: #2c3e50;
        }
        
        .status-badge {
          display: flex;
          justify-content: center;
          margin: 0 auto 2rem;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1.1rem;
          width: fit-content;
        }
        
        .status-badge.valid {
          background-color: rgba(39, 174, 96, 0.1);
          color: #27ae60;
        }
        
        .status-badge.invalid {
          background-color: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }
        
        .status-badge.requirements-not-met {
          background-color: rgba(243, 156, 18, 0.1);
          color: #f39c12;
        }
        
        .certificate-section {
          background-color: white;
          border-radius: 8px;
          padding: 1.75rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .certificate-section h3 {
          margin: 0 0 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding-bottom: 0.75rem;
          font-size: 1.15rem;
          font-weight: 600;
          color: #34495e;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.25rem;
        }
        
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-bottom: 0.5rem;
        }
        
        .info-value {
          font-size: 1rem;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .status-text {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-text.valid {
          color: #27ae60;
        }
        
        .status-text.invalid {
          color: #e74c3c;
        }
        
        .signers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .signer-card {
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .signer-header {
          display: flex;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .signer-icon {
          margin-right: 1rem;
          width: 40px;
          height: 40px;
          background-color: rgba(0, 0, 0, 0.04);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .signer-title {
          flex: 1;
        }
        
        .signer-title h4 {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
        }
        
        .validation-status {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .validation-status.valid {
          color: #27ae60;
        }
        
        .validation-status.invalid {
          color: #e74c3c;
        }
        
        .signer-details {
          padding: 1rem;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.75rem;
          align-items: flex-start;
        }
        
        .detail-icon {
          margin-right: 0.75rem;
          width: 20px;
          color: #95a5a6;
        }
        
        .detail-label {
          width: 150px;
          color: #7f8c8d;
        }
        
        .detail-value {
          flex: 1;
          color: #2c3e50;
        }
        
        .certificate-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed rgba(0, 0, 0, 0.1);
        }
        
        .certificate-info h5 {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
          color: #7f8c8d;
        }
        
        .cert-text {
          background-color: rgba(0, 0, 0, 0.02);
          padding: 1rem;
          border-radius: 6px;
        }
        
        .cert-row {
          margin-bottom: 0.5rem;
        }
        
        .cert-label {
          display: block;
          font-size: 0.8rem;
          color: #95a5a6;
          margin-bottom: 0.25rem;
        }
        
        .cert-value {
          font-size: 0.85rem;
          word-break: break-all;
        }
        
        .certificate-footer {
          margin-top: 2rem;
          text-align: center;
          color: #7f8c8d;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        
        /* Styles for failure reasons */
        .failure-reasons {
          background-color: rgba(243, 156, 18, 0.05);
          border-left: 4px solid #f39c12;
        }
        
        .reasons-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .reason-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          color: #e67e22;
        }
        
        .reason-item:last-child {
          border-bottom: none;
        }
        
        .reason-icon {
          margin-right: 0.75rem;
          color: #f39c12;
          display: flex;
        }
        
        /* Styles for requirements */
        .setting-requirement {
          font-size: 0.85rem;
          margin-left: 0.5rem;
          color: #7f8c8d;
        }
        
        .setting-requirement.not-met {
          color: #e74c3c;
          font-weight: 500;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .certificate-container {
            width: 95%;
            max-height: 85vh;
          }
          
          .certificate-body {
            padding: 1.5rem;
          }
          
          .certificate-title h1 {
            font-size: 1.5rem;
          }
          
          .status-badge {
            font-size: 1rem;
            padding: 0.5rem 1.25rem;
          }
          
          .certificate-section {
            padding: 1.25rem;
          }
          
          .detail-row {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .detail-label {
            width: auto;
          }
        }
      `}</style>
    </div>
  )
} 