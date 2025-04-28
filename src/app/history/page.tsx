'use client'

import { useState, useEffect } from 'react'
import { Button, Paper, Typography, Box, IconButton, Chip } from '@mui/material'
import { History, Trash2, CheckCircle, AlertTriangle, Clock, FileText, Search, RefreshCw, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MainContent from '@/components/layout/MainContent'
import validationHistory, { type ValidationHistoryItem } from '@/utils/validationHistory'
import CertificateView from '@/components/features/validator/CertificateView'
import type { SignerInfo } from '@/types/validation'
import { useTranslations } from 'next-intl'

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

export default function HistoryPage() {
  const [history, setHistory] = useState<ValidationHistoryItem[]>([])
  const [selectedValidation, setSelectedValidation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const router = useRouter()
  const t = useTranslations('History')

  // Load history from localStorage on component mount
  useEffect(() => {
    setHistory(validationHistory.getHistory())
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle clearing all history
  const handleClearHistory = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      validationHistory.clearHistory()
      setHistory([])
    }
  }

  // Handle removing a single history item
  const handleRemoveItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening the certificate
    validationHistory.removeFromHistory(id)
    setHistory(validationHistory.getHistory())
    if (selectedValidation === id) {
      setSelectedValidation(null)
    }
  }

  // Fetch and display certificate for a validation
  const handleViewCertificate = async (id: string, filename: string) => {
    setSelectedValidation(id)
    setIsLoading(true)
    
    try {
      // Fetch certificate data from API with filename
      const response = await fetch(`/api/certificate/${id}?filename=${encodeURIComponent(filename)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificate data')
      }
      
      const certData = await response.json()
      
      // Ensure the data is in the correct format
      if (certData?.validation) {
        // Make sure the validation data has the correct values
        const isValid = certData.validation.indication === "TOTAL-PASSED" || 
                      certData.validation.valid === true
        
        // Get signature counts from signers if available
        const signatureCount = certData.signers?.length || 0
        const validSignatureCount = certData.signers?.filter((signer: SignerInfo) => signer.valid).length || 0
        
        const certificateWithValidData: CertificateData = {
          ...certData,
          validation: {
            ...certData.validation,
            valid: isValid,
            signatures: certData.validation.signatures || signatureCount,
            validSignatures: certData.validation.validSignatures || validSignatureCount,
          },
          signers: certData.signers || []
        }
        
        // Show certificate in modal
        setCertificateData(certificateWithValidData)
        setShowCertificate(true)
      } else {
        throw new Error('Invalid certificate data format received')
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
      alert('There was an error generating the certificate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const closeCertificate = () => {
    setShowCertificate(false)
    setSelectedValidation(null)
  }

  return (
    <MainContent
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="history-container">
        {/* Show certificate modal when data is available */}
        {showCertificate && certificateData && (
          <CertificateView data={certificateData} onClose={closeCertificate} />
        )}
      
        <Paper 
          elevation={3} 
          sx={{ 
            width: '100%', 
            maxWidth: 1200, 
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <History size={22} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {t('historyTitle')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshCw size={16} />}
                onClick={() => router.push('/validate')}
                sx={{
                  borderColor: 'rgba(0,0,0,0.2)',
                  color: 'rgba(0,0,0,0.7)',
                  textTransform: 'none'
                }}
              >
                {t('newValidation')}
              </Button>
              {history.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={handleClearHistory}
                  sx={{ textTransform: 'none' }}
                >
                  {t('clearHistory')}
                </Button>
              )}
            </Box>
          </Box>

          {history.length === 0 ? (
            <Box sx={{ 
              py: 5, 
              px: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <Search size={48} color="#ccc" />
              <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                {t('noHistoryTitle')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 3, color: 'text.secondary', maxWidth: 500 }}>
                {t('noHistoryDescription')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/validate')}
                startIcon={<FileText size={16} />}
                sx={{
                  bgcolor: '#e74c3c',
                  '&:hover': { bgcolor: '#c0392b' },
                  textTransform: 'none',
                  px: 3,
                  py: 1
                }}
              >
                {t('validateDocument')}
              </Button>
            </Box>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className={`history-item ${selectedValidation === item.id ? 'selected' : ''}`}
                >
                  <div className="item-icon">
                    {item.valid ? 
                      <CheckCircle size={28} color="#27ae60" /> : 
                      <AlertTriangle size={28} color="#e74c3c" />
                    }
                  </div>
                  <div className="item-content">
                    <div className="item-header">
                      <h3 className="item-filename">
                        {item.filename}
                      </h3>
                    </div>
                    <div className="item-details">
                      <div className="item-date">
                        <Clock size={16} />
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                      <div className="item-signatures">
                        <Chip 
                          size="small"
                          label={t('validSignatures', { count: item.validSignatures, total: item.totalSignatures })}
                          sx={{ 
                            fontSize: '0.75rem',
                            bgcolor: item.valid ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                            color: item.valid ? '#27ae60' : '#e74c3c',
                            height: '24px',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Eye size={16} />}
                      onClick={() => handleViewCertificate(item.id, item.filename)}
                      disabled={isLoading && selectedValidation === item.id}
                      sx={{
                        borderColor: '#e74c3c',
                        color: '#e74c3c',
                        '&:hover': {
                          borderColor: '#c0392b',
                          bgcolor: 'rgba(231, 76, 60, 0.05)'
                        },
                        textTransform: 'none'
                      }}
                    >
                      {isLoading && selectedValidation === item.id ? t('loading') : t('viewCertificate')}
                    </Button>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleRemoveItem(item.id, e)}
                      className="remove-button"
                      aria-label="Remove from history"
                      sx={{
                        color: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': {
                          color: '#e74c3c',
                          bgcolor: 'rgba(231, 76, 60, 0.05)'
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Paper>
      </div>

      <style jsx>{`
        .history-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        
        .history-item {
          display: flex;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: relative;
          align-items: center;
          gap: 1.5rem;
          transition: background-color 0.2s ease;
        }
        
        .history-item:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .history-item.selected {
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
        }
        
        .item-content {
          flex: 1;
          min-width: 0; /* Helps with text overflow */
        }
        
        .item-header {
          margin-bottom: 0.5rem;
        }
        
        .item-filename {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.85);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-actions {
          display: flex;
          gap: 0.75rem;
          margin-left: auto;
          flex-shrink: 0;
        }
        
        .item-details {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.9rem;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .item-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .history-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .item-actions {
            width: 100%;
            justify-content: flex-end;
            margin-left: 0;
          }
          
          .item-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </MainContent>
  )
} 