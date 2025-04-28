'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, FileCheck, Download, User, Calendar, Award, Globe, ShieldCheck, Mail, User2, Info, HelpCircle } from 'lucide-react'
import type { SignatureQuality, Legislation, SignerInfo } from '@/types/validation'; // Use direct path
import CertificateView from './CertificateView'
import { useTranslations } from 'next-intl'

// Helper component for tooltips
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-content">{content}</div>
      <style jsx>{`
        .tooltip-container {
          position: relative;
          display: inline-flex;
          margin-left: 5px;
          cursor: help;
        }
        .tooltip-container:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 5px;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          z-index: 9999;
          width: max-content;
          max-width: 220px;
          visibility: hidden;
          opacity: 0;
          transition: all 0.3s ease;
          text-align: center;
          pointer-events: none;
        }
        .tooltip-content::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
        }
      `}</style>
    </div>
  );
};

// Interface for certificate data that matches the CertificateView component's requirements
interface CertificateData {
  id: string;
  timestamp: string;
  validation: {
    id: string;
    valid: boolean;
    signatures: number;
    validSignatures: number;
    quality?: string;
    legislation?: string;
    longTermValidation?: boolean;
    visualDifferences?: boolean;
    undefinedChanges?: boolean;
    timestamp: string;
    filename: string;
  };
  signers: SignerInfo[];
}

// Interface for failure reason items
interface FailureReason {
  id: string;
  text: string;
}

// New, simplified type for the data structure this component needs
export interface ValidationDisplayData {
  id: string;
  valid: boolean;
  filename: string;
  size: number;
  timestamp: string; // Timestamp of validation
  totalSignatures: number;
  validSignatures: number;
  // Optional fields from API to display
  quality?: SignatureQuality;
  legislation?: Legislation;
  longTermValidation?: boolean;
  visualDifferences?: boolean;
  undefinedChanges?: boolean;
  // New fields for validation settings
  settingsQuality?: SignatureQuality;
  settingsLegislation?: Legislation;
  settingsLongTermValidation?: boolean;
  settingsRejectVisualDifferences?: boolean;
  settingsRejectUndefinedChanges?: boolean;
}

interface ValidationResultsProps {
  data: ValidationDisplayData | null;
  signerInfo?: SignerInfo[] | null;
  isLoadingSigners?: boolean;
}

export default function ValidationResults({ data, signerInfo, isLoadingSigners = false }: ValidationResultsProps) {
  const t = useTranslations('ValidationResults')
  const ts = useTranslations('SignerInfo')
  const tt = useTranslations('Tooltips')
  const [expandedSigner, setExpandedSigner] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  
  if (!data) return null;

  // Determine if validation failed due to specific settings
  const failedDueToQuality = !data.valid && data.quality && data.settingsQuality && 
    !isHigherOrEqualQuality(data.quality, data.settingsQuality);
  
  const failedDueToLegislation = !data.valid && data.legislation && data.settingsLegislation && 
    data.legislation !== data.settingsLegislation;
  
  const failedDueToLongTermValidation = !data.valid && data.settingsLongTermValidation && 
    !data.longTermValidation;
  
  const failedDueToVisualDifferences = !data.valid && data.settingsRejectVisualDifferences && 
    data.visualDifferences;
  
  const failedDueToUndefinedChanges = !data.valid && data.settingsRejectUndefinedChanges && 
    data.undefinedChanges;
    
  // Determine if the validation failure is only due to settings
  const failedDueToSettingsOnly = 
    !data.valid && 
    data.validSignatures > 0 && 
    (failedDueToQuality || 
     failedDueToLegislation || 
     failedDueToLongTermValidation || 
     failedDueToVisualDifferences || 
     failedDueToUndefinedChanges);

  // Helper function to determine if a quality meets or exceeds the required level
  function isHigherOrEqualQuality(actual: SignatureQuality, required: SignatureQuality): boolean {
    const levels: Record<SignatureQuality, number> = {
      'SES': 1,
      'AES': 2,
      'QES': 3
    };
    return levels[actual] >= levels[required];
  }

  // Prepare failure reasons for display
  const failureReasons: FailureReason[] = [];
  if (failedDueToQuality && data.quality && data.settingsQuality) {
    failureReasons.push({
      id: 'quality',
      text: t('failureReasons.quality', { 
        actual: data.quality, 
        required: data.settingsQuality 
      })
    });
  }
  if (failedDueToLegislation && data.legislation && data.settingsLegislation) {
    failureReasons.push({
      id: 'legislation',
      text: t('failureReasons.legislation', { 
        actual: data.legislation, 
        required: data.settingsLegislation 
      })
    });
  }
  if (failedDueToLongTermValidation) {
    failureReasons.push({
      id: 'longTermValidation',
      text: t('failureReasons.longTermValidation')
    });
  }
  if (failedDueToVisualDifferences) {
    failureReasons.push({
      id: 'visualDifferences',
      text: t('failureReasons.visualDifferences')
    });
  }
  if (failedDueToUndefinedChanges) {
    failureReasons.push({
      id: 'undefinedChanges',
      text: t('failureReasons.undefinedChanges')
    });
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Use the pre-calculated counts passed in props
  const totalSignatures = data.totalSignatures;
  const validSignaturesCount = data.validSignatures;
  
  const toggleExpand = (index: number) => {
    setExpandedSigner(expandedSigner === index ? null : index);
  };

  const handleDownloadCertificate = async (id: string) => {
    setIsDownloading(true);
    try {
      // Fetch certificate data from API with the filename
      const response = await fetch(`/api/certificate/${id}?filename=${encodeURIComponent(data.filename)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch certificate data');
      }
      
      const certData = await response.json();

      // Ensure the data is in the correct format
      if (certData?.validation) {
        // Make sure the validation data has the correct values
        const isValid = certData.validation.indication === "TOTAL-PASSED" || 
                        certData.validation.valid === true;
        
        // Get signature counts from signers if available
        const signatureCount = certData.signers?.length || 0;
        const validSignatureCount = certData.signers?.filter((signer: SignerInfo) => signer.valid).length || 0;
        
        const certificateWithValidData: CertificateData = {
          ...certData,
          validation: {
            ...certData.validation,
            valid: isValid,
            signatures: certData.validation.signatures || signatureCount,
            validSignatures: certData.validation.validSignatures || validSignatureCount,
          },
          signers: certData.signers || []
        };
        
        // Show certificate in modal
        setCertificateData(certificateWithValidData);
        setShowCertificate(true);
      } else {
        throw new Error('Invalid certificate data format received');
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      alert('There was an error generating the certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const closeCertificate = () => {
    setShowCertificate(false);
  };

  return (
    <div className="validation-results">
      {/* Show certificate modal when data is available */}
      {showCertificate && certificateData && (
        <CertificateView data={certificateData} onClose={closeCertificate} />
      )}
      
      <div className="results-header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
          <div className={`status-badge big-badge ${data.valid ? 'valid' : (failedDueToSettingsOnly ? 'settings-mismatch' : 'invalid')}`}
            style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
            {data.valid ? (
              <>
                <CheckCircle size={32} />
                <span>{t('validDocument')}</span>
              </>
            ) : failedDueToSettingsOnly ? (
              <>
                <AlertTriangle size={32} />
                <span>{t('requirementsNotMet')}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={32} />
                <span>{t('invalidDocument')}</span>
              </>
            )}
          </div>
          {/* <button 
            type="button"
            className="certificate-button" 
            onClick={() => handleDownloadCertificate(data.id)}
            disabled={isDownloading}
            style={{ margin: '0 auto', minWidth: 220, fontSize: '1.1rem', padding: '0.85rem 2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={20} />
            <span style={{ marginLeft: 10 }}>{isDownloading ? 'Loading...' : t('certButtonTitle')}</span>
          </button> */}
        </div>
      </div>
      
      {/* New Summary Card */}
      <div className="results-card summary-card">
        <div className="summary-content">
          <div className={`summary-icon ${data.valid ? 'valid' : (failedDueToSettingsOnly ? 'settings-mismatch' : 'invalid')}`}>
            {data.valid ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div className="summary-text">
            <h3 className="summary-title">
              {data.valid 
                ? t('validationSuccessful') 
                : (failedDueToSettingsOnly 
                    ? t('validationRequirementsNotMet') 
                    : t('validationFailed')
                  )
              }
            </h3>
            <p className="summary-description">
              {data.valid 
                ? t('validSignatureContent', { 
                    count: data.validSignatures,
                    plural: data.validSignatures !== 1 ? 's' : ''
                  })
                : (failureReasons.length > 0 
                    ? t('invalidSignatureContentWithSettings')
                    : t('invalidSignatureContent', {
                        count: data.totalSignatures - data.validSignatures,
                        plural: (data.totalSignatures - data.validSignatures) !== 1 ? 's' : ''
                      })
                  )
              }
            </p>
            
            {/* Display validation failure reasons if any */}
            {!data.valid && failureReasons.length > 0 && (
              <div className="failure-reasons">
                <div className="failure-reasons-title">{t('failureReasonsTitle')}</div>
                <ul className="failure-reasons-list">
                  {failureReasons.map((reason) => (
                    <li key={reason.id} className="failure-reason-item">
                      <AlertTriangle size={14} />
                      <span>{reason.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{formatDate(data.timestamp)}</span>
                <span className="stat-label">{t('validationTime')}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{data.validSignatures}/{data.totalSignatures}</span>
                <span className="stat-label">{t('validSignaturesCount')}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{data.quality || 'N/A'}</span>
                <span className="stat-label">{t('signatureQualityShort')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="results-card document-info">
        <h3 className="card-title">
          {t('documentInfo')}
          <Tooltip content={tt('documentInfo')}>
            <HelpCircle size={16} />
          </Tooltip>
        </h3>
        <div className="info-content">
          <div className="info-icon">
            <FileCheck size={48} color="#e74c3c" />
          </div>
          <div className="info-details">
            <div className="info-row">
              <span className="info-label">{t('filename')}:</span>
              <span className="info-value">{data.filename}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('fileSize')}:</span>
              <span className="info-value">{formatFileSize(data.size)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('validatedOn')}:</span>
              <span className="info-value">{formatDate(data.timestamp)}</span> 
            </div>
            <div className="info-row">
              <span className="info-label">{t('documentStatus')}:</span>
              <span className={`info-value status-text ${data.valid ? 'valid' : (failedDueToSettingsOnly ? 'settings-mismatch' : 'invalid')}`}>
                {data.valid 
                  ? t('validDocument') 
                  : (failedDueToSettingsOnly 
                      ? t('requirementsNotMet') 
                      : t('invalidDocument')
                    )
                }
                <Tooltip content={data.valid 
                  ? tt('validDocumentStatus') 
                  : (failedDueToSettingsOnly
                      ? tt('requirementsNotMetStatus')
                      : tt('invalidDocumentStatus')
                    )
                }>
                  <Info size={16} />
                </Tooltip>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="results-card signatures-card">
        <h3 className="card-title">
          {t('signatures')}
          <Tooltip content={tt('signatures')}>
            <HelpCircle size={16} />
          </Tooltip>
        </h3>
        
        <p className="section-description">
          {t('signatureInfoDescription')}
        </p>
        
        <div className="signature-summary">
          <div className="summary-card">
            <div className="summary-header">
              <span>{t('signatures')}:</span>
              <Tooltip content={tt('signaturesCount')}>
                <Info size={14} />
              </Tooltip>
            </div>
            <div className="summary-value">
              {totalSignatures}
            </div>
          </div>
          
          {totalSignatures > 0 && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('valid')}:</span>
                <Tooltip content={tt('validSignatures')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value ${validSignaturesCount === totalSignatures ? 'valid' : (validSignaturesCount > 0 ? 'partial' : 'invalid')}`}>
                {validSignaturesCount} / {totalSignatures}
              </div>
            </div>
          )}
          
          {data.quality && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('qualityLabel')}:</span>
                <Tooltip content={tt('signatureQuality')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value quality ${failedDueToQuality ? 'invalid-due-to-settings' : ''}`}>
                {data.quality}
                {data.settingsQuality && (
                  <div className="setting-requirement">
                    {failedDueToQuality ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    <span>{t('requiredQuality')}: {data.settingsQuality}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {data.legislation && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('legislationLabel')}:</span>
                <Tooltip content={tt('legislation')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value ${failedDueToLegislation ? 'invalid-due-to-settings' : ''}`}>
                {data.legislation}
                {data.settingsLegislation && (
                  <div className="setting-requirement">
                    {failedDueToLegislation ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    <span>{t('requiredLegislation')}: {data.settingsLegislation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {data.longTermValidation !== undefined && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('longTermLabel')}:</span>
                <Tooltip content={tt('longTermValidation')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value ${data.longTermValidation ? 'valid' : (failedDueToLongTermValidation ? 'invalid-due-to-settings' : 'invalid-subtle')}`}>
                {data.longTermValidation ? t('yes') : t('no')}
                {data.settingsLongTermValidation && !data.longTermValidation && (
                  <div className="setting-requirement">
                    <AlertTriangle size={14} />
                    <span>{t('requiredLongTerm')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {data.visualDifferences !== undefined && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('visualDifferencesLabel')}:</span>
                <Tooltip content={tt('visualDifferences')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value ${!data.visualDifferences ? 'valid' : (failedDueToVisualDifferences ? 'invalid-due-to-settings' : 'invalid-subtle')}`}>
                {!data.visualDifferences ? t('noDetectedChanges') : t('detectedChanges')}
                {data.settingsRejectVisualDifferences && data.visualDifferences && (
                  <div className="setting-requirement">
                    <AlertTriangle size={14} />
                    <span>{t('rejectedVisualDifferences')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {data.undefinedChanges !== undefined && (
            <div className="summary-card">
              <div className="summary-header">
                <span>{t('undefinedChangesLabel')}:</span>
                <Tooltip content={tt('undefinedChanges')}>
                  <Info size={14} />
                </Tooltip>
              </div>
              <div className={`summary-value ${!data.undefinedChanges ? 'valid' : (failedDueToUndefinedChanges ? 'invalid-due-to-settings' : 'invalid-subtle')}`}>
                {!data.undefinedChanges ? t('noDetectedChanges') : t('detectedChanges')}
                {data.settingsRejectUndefinedChanges && data.undefinedChanges && (
                  <div className="setting-requirement">
                    <AlertTriangle size={14} />
                    <span>{t('rejectedUndefinedChanges')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Signer Information Section */}
        {isLoadingSigners && (
          <div className="signer-info-loading">
            <div className="loading-spinner" />
            <p>{ts('loading')}</p>
          </div>
        )}
        
        {signerInfo && signerInfo.length > 0 && (
          <div className="signers-info-section">
            <h4 className="section-subtitle">
              {ts('title')}
              <Tooltip content={tt('signerInfo')}>
                <HelpCircle size={14} />
              </Tooltip>
            </h4>
            <div className="signers-list">
              {signerInfo.map((signer, index) => (
                <div 
                  key={`signer-${signer.certificate.serialNumber}-${index}`}
                  className={`signer-card ${signer.valid ? 'valid' : 'invalid'} ${expandedSigner === index ? 'expanded' : ''}`}
                >
                  <button 
                    className="signer-header" 
                    onClick={() => toggleExpand(index)}
                    type="button"
                    aria-expanded={expandedSigner === index}
                  >
                    <div className="signer-avatar">
                      <User size={24} color={signer.valid ? '#27ae60' : '#e74c3c'} />
                    </div>
                    <div className="signer-summary">
                      <h4 className="signer-name">{signer.signer}</h4>
                      <span className="signature-time">{formatDate(signer.time)}</span>
                    </div>
                    <div className="signer-badges">
                      <span className={`quality-badge ${signer.quality.toLowerCase()}`}>
                        {signer.quality}
                        <Tooltip content={
                          signer.quality === 'QES' ? tt('qesSignature') :
                          signer.quality === 'AES' ? tt('aesSignature') :
                          tt('sesSignature')
                        }>
                          <Info size={12} />
                        </Tooltip>
                      </span>
                      <span className={`validation-badge ${signer.valid ? 'valid' : 'invalid'}`}>
                        {signer.valid ? t('valid') : t('invalid')} 
                        <Tooltip content={signer.valid ? 
                          tt('validSignature') : 
                          tt('invalidSignature')
                        }>
                          <Info size={12} />
                        </Tooltip>
                      </span>
                    </div>
                    <div className="expand-indicator">
                      <span className="expand-icon">{expandedSigner === index ? '−' : '+'}</span>
                    </div>
                  </button>
                  
                  {expandedSigner === index && (
                    <div className="signer-details">
                      <div className="detail-row">
                        <div className="detail-icon"><Calendar size={16} /></div>
                        <div className="detail-label">{ts('signedOn')}</div>
                        <div className="detail-value">{formatDate(signer.time)}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-icon"><Award size={16} /></div>
                        <div className="detail-label">
                          {ts('signatureQuality')}
                          <Tooltip content={tt('signatureQualityLevel')}>
                            <Info size={12} />
                          </Tooltip>
                        </div>
                        <div className="detail-value quality">{signer.quality}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-icon"><Globe size={16} /></div>
                        <div className="detail-label">
                          {ts('legislation')}
                          <Tooltip content={tt('signerLegislation')}>
                            <Info size={12} />
                          </Tooltip>
                        </div>
                        <div className="detail-value">{signer.legislation}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-icon"><ShieldCheck size={16} /></div>
                        <div className="detail-label">
                          {ts('longTermValidation')}
                          <Tooltip content={tt('signerLongTermValidation')}>
                            <Info size={12} />
                          </Tooltip>
                        </div>
                        <div className="detail-value">{signer.longTermValidation ? t('yes') : t('no')}</div>
                      </div>
                      
                      {signer.optionalInfos?.contact && (
                        <div className="detail-row">
                          <div className="detail-icon"><Mail size={16} /></div>
                          <div className="detail-label">{ts('contact')}</div>
                          <div className="detail-value">{signer.optionalInfos.contact}</div>
                        </div>
                      )}
                      
                      {signer.optionalInfos?.name && (
                        <div className="detail-row">
                          <div className="detail-icon"><User2 size={16} /></div>
                          <div className="detail-label">{ts('displayName')}</div>
                          <div className="detail-value">{signer.optionalInfos.name}</div>
                        </div>
                      )}
                      
                      <div className="certificate-section">
                        <h5>
                          {ts('certificateInfo')}
                          <Tooltip content={tt('certificateInfo')}>
                            <HelpCircle size={12} />
                          </Tooltip>
                        </h5>
                        <div className="certificate-data">
                          <div className="cert-item">
                            <span className="cert-label">{ts('subject')}:</span>
                            <span className="cert-value">{signer.certificate.subject}</span>
                          </div>
                          <div className="cert-item">
                            <span className="cert-label">{ts('issuer')}:</span>
                            <span className="cert-value">{signer.certificate.issuer}</span>
                          </div>
                          <div className="cert-item">
                            <span className="cert-label">{ts('serialNumber')}:</span>
                            <span className="cert-value cert-serial">{signer.certificate.serialNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="results-card certificate-card">
        <h3 className="card-title">
          {t('viewDetails')}
          <Tooltip content={tt('validationCertificate')}>
            <HelpCircle size={16} />
          </Tooltip>
        </h3>
        <div className="certificate-content">
          <div className="certificate-icon">
            <FileCheck size={32} color="#e74c3c" />
          </div>
          <h4 className="certificate-title">{t('certificateTitle')}</h4>
          
          <p className="certificate-description">
            {t('certificateDescription')}
          </p>
          
          <div className="certificate-id">
            <span className="id-label">{t('validationID')}</span>
            <span className="id-value">{data.id}</span>
          </div>
          
          <button 
            type="button"
            className="download-button"
            onClick={() => handleDownloadCertificate(data.id)}
            disabled={isDownloading}
            title="Download Certificate"
          >
            <Download size={18} />
            <span>{isDownloading ? 'Generating...' : t('certButtonTitle')}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .validation-results {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem;
          overflow: visible;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-weight: 500;
          font-size: 0.95rem;
        }
        
        .status-badge.valid {
          background-color: rgba(39, 174, 96, 0.1);
          color: #27ae60;
        }
        
        .status-badge.invalid {
          background-color: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }
        
        .status-badge.settings-mismatch {
          background-color: rgba(243, 156, 18, 0.1);
          color: #f39c12;
        }
        
        .reset-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.23);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(0, 0, 0, 0.87);
          font-weight: 500;
          font-size: 0.95rem;
        }
        
        .reset-button:hover {
          background-color: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.42);
        }
        
        .results-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 1.75rem;
          background-color: white;
          overflow: visible;
        }
        
        .signatures-card {
          background: linear-gradient(to bottom, white, #fafafa);
        }
        
        .card-title {
          font-size: 1.4rem;
          font-weight: 500;
          margin: 0 0 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.87);
        }
        
        .document-info {
          border-left: 4px solid #3498db;
        }
        
        .info-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }
        
        .info-icon {
          padding: 0.5rem;
          background-color: rgba(231, 76, 60, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .info-details {
          flex: 1;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .info-label {
          width: 140px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.6);
          flex-shrink: 0;
        }
        
        .info-value {
          flex: 1;
          word-break: break-word;
          min-width: 0;
        }
        
        .status-text.valid {
          color: #27ae60;
          font-weight: 500;
        }
        
        .status-text.invalid {
          color: #e74c3c;
          font-weight: 500;
        }
        
        .status-text.settings-mismatch {
          color: #f39c12;
          font-weight: 500;
        }
        
        .signature-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 640px) {
          .signature-summary {
            grid-template-columns: 1fr;
          }
        }
        
        .summary-card {
          background: white;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          overflow: visible;
        }
        
        .summary-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .summary-description {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        
        .summary-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
        }
        
        .summary-value.valid {
          color: #27ae60;
        }
        
        .summary-value.partial {
          color: #f39c12;
        }
        
        .summary-value.invalid {
          color: #e74c3c;
        }
        
        .summary-value.invalid-subtle {
          color: #e74c3c;
          opacity: 0.8;
        }
        
        .certificate-card {
          background: white;
          border-left: 4px solid #e74c3c;
        }
        
        .certificate-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem 2rem;
        }
        
        .certificate-icon {
          background-color: rgba(231, 76, 60, 0.1);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .certificate-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
          margin: 0 0 1rem;
        }
        
        .certificate-description {
          max-width: 600px;
          margin: 0 auto 1.5rem;
          font-size: 0.95rem;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.5;
        }
        
        .certificate-id {
          background-color: rgba(0, 0, 0, 0.03);
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-family: monospace;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          width: 100%;
          max-width: 500px;
          justify-content: center;
        }
        
        .id-label {
          font-weight: 600;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .id-value {
          color: rgba(0, 0, 0, 0.87);
          word-break: break-all;
        }
        
        .download-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          max-width: 250px;
          justify-content: center;
        }
        
        .download-button:hover:not(:disabled) {
          background-color: #c0392b;
        }
        
        .download-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .header-actions {
          display: none;
        }

        .certificate-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .certificate-button:hover {
          background-color: #c0392b;
        }

        .certificate-button:disabled {
          background-color: #e57373;
          cursor: not-allowed;
        }

        .certificate-features {
          display: flex;
          gap: 1rem;
          margin-top: 0.75rem;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background-color: rgba(39, 174, 96, 0.15);
          color: #27ae60;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .feature-text {
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.7);
        }
        
        .validation-id {
          font-family: monospace;
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 5px;
          border-radius: 3px;
          margin-left: 5px;
          font-size: 0.9rem;
          cursor: help;
        }
        
        .expand-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background-color: rgba(0, 0, 0, 0.05);
          margin-left: 8px;
        }
        
        .expand-icon {
          font-size: 16px;
          line-height: 1;
          color: rgba(0, 0, 0, 0.5);
        }
        
        .summary-card {
          background: linear-gradient(135deg, #fff, #f8f9fa);
          border-left: 4px solid ${data.valid ? '#27ae60' : '#e74c3c'};
          margin-bottom: 1.5rem;
        }
        
        .summary-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        @media (max-width: 640px) {
          .summary-content {
            flex-direction: column;
            text-align: center;
          }
          
          .summary-stats {
            flex-direction: column;
            gap: 1rem;
          }
          
          .stat-divider {
            width: 80%;
            height: 1px;
            margin: 0 auto;
          }
        }
        
        .summary-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .summary-icon.valid {
          background-color: rgba(39, 174, 96, 0.1);
          color: #27ae60;
        }
        
        .summary-icon.invalid {
          background-color: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }
        
        .summary-icon.settings-mismatch {
          background-color: rgba(243, 156, 18, 0.1);
          color: #f39c12;
        }
        
        .summary-text {
          flex: 1;
        }
        
        .summary-title {
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: ${data.valid ? '#27ae60' : (failedDueToSettingsOnly ? '#f39c12' : '#e74c3c')};
        }
        
        .summary-description {
          margin: 0 0 1rem;
          color: rgba(0, 0, 0, 0.7);
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .summary-stats {
          display: flex;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.03);
          padding: 1rem;
          border-radius: 10px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.8);
          margin-bottom: 0.3rem;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: rgba(0, 0, 0, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-divider {
          width: 1px;
          height: 40px;
          background-color: rgba(0, 0, 0, 0.1);
        }

        .signers-info-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed rgba(0, 0, 0, 0.12);
        }
        
        .section-subtitle {
          font-size: 1.2rem;
          font-weight: 500;
          margin: 0 0 1.25rem;
          color: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
        }
        
        .signers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        
        .signer-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.06);
          overflow: visible;
          transition: all 0.3s ease;
        }
        
        .signer-card.expanded {
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
        }
        
        .signer-card.valid {
          border-left: 4px solid #27ae60;
        }
        
        .signer-card.invalid {
          border-left: 4px solid #e74c3c;
        }
        
        .signer-header {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
          text-align: left;
        }
        
        .signer-header:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .signer-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 50%;
          margin-right: 1rem;
        }
        
        .signer-summary {
          flex: 1;
        }
        
        .signer-name {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
        }
        
        .signature-time {
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .signer-badges {
          display: flex;
          gap: 0.5rem;
        }
        
        .quality-badge, .validation-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .quality-badge {
          background: rgba(236, 240, 241, 0.5);
          color: #34495e;
        }
        
        .quality-badge.qes {
          background: rgba(52, 152, 219, 0.15);
          color: #2980b9;
        }
        
        .quality-badge.aes {
          background: rgba(155, 89, 182, 0.15);
          color: #8e44ad;
        }
        
        .quality-badge.ses {
          background: rgba(241, 196, 15, 0.15);
          color: #f39c12;
        }
        
        .validation-badge.valid {
          background: rgba(46, 204, 113, 0.15);
          color: #27ae60;
        }
        
        .validation-badge.invalid {
          background: rgba(231, 76, 60, 0.15);
          color: #c0392b;
        }
        
        .signer-details {
          padding: 0.5rem 1.5rem 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          animation: slideDown 0.3s ease-out;
          overflow: visible;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          margin: 0.85rem 0;
          font-size: 0.95rem;
          overflow: visible;
        }
        
        @media (max-width: 640px) {
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .detail-label, .detail-value {
            width: 100%;
          }
        }
        
        .detail-icon {
          width: 24px;
          color: rgba(0, 0, 0, 0.4);
          margin-right: 0.75rem;
        }
        
        .detail-label {
          width: 170px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.7);
          overflow: visible;
        }
        
        .detail-value {
          flex: 1;
          color: rgba(0, 0, 0, 0.87);
        }
        
        .detail-value.quality {
          font-weight: 500;
        }
        
        .certificate-section {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px dashed rgba(0, 0, 0, 0.08);
        }
        
        .certificate-section h5 {
          margin: 0 0 1rem;
          font-size: 0.95rem;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 500;
        }
        
        .certificate-data {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.02);
          padding: 1rem;
          border-radius: 8px;
        }
        
        .cert-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .cert-label {
          font-size: 0.8rem;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 500;
        }
        
        .cert-value {
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.8);
          word-break: break-all;
        }
        
        .cert-serial {
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        .signer-info-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: rgba(0, 0, 0, 0.6);
          margin-top: 1rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #e74c3c;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .section-description {
          color: rgba(0, 0, 0, 0.7);
          font-size: 1rem;
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .failure-reasons {
          background-color: rgba(231, 76, 60, 0.08);
          border: 1px solid rgba(231, 76, 60, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin: 0.5rem 0 1.5rem;
        }
        
        .failure-reasons-title {
          font-weight: 600;
          color: #e74c3c;
          margin-bottom: 0.75rem;
        }
        
        .failure-reasons-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .failure-reason-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(231, 76, 60, 0.9);
        }
        
        .setting-requirement {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.6);
          border-top: 1px dashed rgba(0, 0, 0, 0.1);
          padding-top: 0.5rem;
        }
        
        .summary-value.invalid-due-to-settings {
          color: #e74c3c;
          font-weight: 600;
          background-color: rgba(231, 76, 60, 0.05);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .status-badge.big-badge {
          font-size: 1.45rem;
          padding: 1.1rem 2.5rem;
          border-radius: 60px;
          font-weight: 700;
          min-width: 320px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
} 