'use client'

import { useState } from 'react'
import { User, Calendar, Award, Globe, ShieldCheck, Mail, User2 } from 'lucide-react'
import type { SignerInfo } from '@/types/validation'

interface SignerInfoDisplayProps {
  signers: SignerInfo[] | null
  isLoading: boolean
}

export default function SignerInfoDisplay({ signers, isLoading }: SignerInfoDisplayProps) {
  const [expandedSigner, setExpandedSigner] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="signer-info-loading">
        <div className="loading-spinner" />
        <p>Loading signer information...</p>
      </div>
    )
  }

  if (!signers || signers.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const toggleExpand = (index: number) => {
    setExpandedSigner(expandedSigner === index ? null : index)
  }

  return (
    <div className="signers-info-container">
      <div className="signers-list">
        {signers.map((signer, index) => (
          <div 
            key={`signer-${signer.certificate.serialNumber}-${index}`}
            className={`signer-card ${signer.valid ? 'valid-card' : 'invalid-card'} ${expandedSigner === index ? 'expanded' : ''}`}
          >
            <button 
              type="button"
              className="signer-header" 
              onClick={() => toggleExpand(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleExpand(index)
                }
              }}
              tabIndex={0}
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
                </span>
                <span className={`validation-badge ${signer.valid ? 'valid' : 'invalid'}`}>
                  {signer.valid ? 'Valid' : 'Invalid'} 
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
                  <div className="detail-label">Signed on:</div>
                  <div className="detail-value">{formatDate(signer.time)}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-icon"><Award size={16} /></div>
                  <div className="detail-label">Signature Quality:</div>
                  <div className="detail-value quality">{signer.quality}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-icon"><Globe size={16} /></div>
                  <div className="detail-label">Legislation:</div>
                  <div className="detail-value">{signer.legislation}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-icon"><ShieldCheck size={16} /></div>
                  <div className="detail-label">Long-Term Validation:</div>
                  <div className="detail-value">{signer.longTermValidation ? 'Yes' : 'No'}</div>
                </div>
                
                {signer.optionalInfos?.contact && (
                  <div className="detail-row">
                    <div className="detail-icon"><Mail size={16} /></div>
                    <div className="detail-label">Contact:</div>
                    <div className="detail-value">{signer.optionalInfos.contact}</div>
                  </div>
                )}
                
                {signer.optionalInfos?.name && (
                  <div className="detail-row">
                    <div className="detail-icon"><User2 size={16} /></div>
                    <div className="detail-label">Display Name:</div>
                    <div className="detail-value">{signer.optionalInfos.name}</div>
                  </div>
                )}
                
                <div className="certificate-section">
                  <h5>Certificate Information</h5>
                  <div className="certificate-data">
                    <div className="cert-item">
                      <span className="cert-label">Subject:</span>
                      <span className="cert-value">{signer.certificate.subject}</span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Issuer:</span>
                      <span className="cert-value">{signer.certificate.issuer}</span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Serial Number:</span>
                      <span className="cert-value cert-serial">{signer.certificate.serialNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .signers-info-container {
          width: 100%;
          margin: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .section-title {
          font-size: 1.4rem;
          font-weight: 500;
          margin: 0 0 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.87);
        }
        
        .signers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        
        .signer-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .signer-card.expanded {
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.12);
        }
        
        .signer-card.valid-card {
          border-left: 4px solid #27ae60;
        }
        
        .signer-card.invalid-card {
          border-left: 4px solid #e74c3c;
        }
        
        .signer-header {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          width: 100%;
          border: none;
          background: transparent;
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
          display: inline-block;
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
        
        .expand-indicator {
          margin-left: 1rem;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .expand-icon {
          font-size: 1.5rem;
          line-height: 1;
          color: rgba(0, 0, 0, 0.4);
        }
        
        .signer-details {
          padding: 0.5rem 1.5rem 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          animation: slideDown 0.3s ease-out;
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
      `}</style>
    </div>
  )
} 