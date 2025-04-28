'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, FileCheck, Download, User, Calendar, Award, Globe, ShieldCheck, Mail, User2, Info, HelpCircle } from 'lucide-react'
import type { SignatureQuality, Legislation, SignerInfo } from '@/types/validation';
import CertificateView from './CertificateView'
import { useTranslations } from 'next-intl'
import "@/styles/results.css"
import "@/styles/tooltip.css"

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
          <div className="summary-card neutral-card">
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
            <div className={`summary-card ${validSignaturesCount === totalSignatures ? 'valid-card' : (validSignaturesCount > 0 ? 'neutral-card' : 'invalid-card')}`}>
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
          
          {/* Signature Quality card */}
          {data.quality && (
            <div className={`summary-card ${data.quality === 'QES' ? 'valid-card' : (failedDueToQuality ? 'invalid-card' : 'neutral-card')}`}>
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
          
          {/* Legislation card */}
          {data.legislation && (
            <div className={`summary-card ${failedDueToLegislation ? 'invalid-card' : 'neutral-card'}`}>
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
          
          {/* Long-term Validation card */}
          {data.longTermValidation !== undefined && (
            <div className={`summary-card ${data.longTermValidation ? 'valid-card' : (failedDueToLongTermValidation ? 'invalid-card' : 'neutral-card')}`}>
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
          
          {/* Visual Differences card */}
          {data.visualDifferences !== undefined && (
            <div className={`summary-card ${!data.visualDifferences ? 'valid-card' : (failedDueToVisualDifferences ? 'invalid-card' : 'neutral-card')}`}>
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
          
          {/* Undefined Changes card */}
          {data.undefinedChanges !== undefined && (
            <div className={`summary-card ${!data.undefinedChanges ? 'valid-card' : (failedDueToUndefinedChanges ? 'invalid-card' : 'neutral-card')}`}>
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
                  className={`signer-card ${signer.valid ? 'valid-card' : 'invalid-card'} ${expandedSigner === index ? 'expanded' : ''}`}
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
    </div>
  );
} 