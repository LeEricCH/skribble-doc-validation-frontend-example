'use client'

import { useState, useEffect } from 'react'
import { Button, Paper, Typography, Box, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { History, Trash2, CheckCircle, AlertTriangle, FileText, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MainContent from '@/components/layout/MainContent'
import validationStorage from '@/utils/validationStorage'
import type { ValidationResponse } from '@/types/validation'
import type { BatchValidationResult } from '@/utils/validationStorage'
import { useTranslations } from 'next-intl'

export default function HistoryPage() {
  const [history, setHistory] = useState<BatchValidationResult[]>([])
  const [selectedValidation, setSelectedValidation] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations('History')

  // Load history from localStorage on component mount
  useEffect(() => {
    setHistory(validationStorage.getHistory())
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle clearing all history
  const handleClearHistory = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      validationStorage.clearValidationData()
      setHistory([])
    }
  }

  // Handle removing a single history item
  const handleRemoveItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    // Remove from history by clearing all data
    validationStorage.clearValidationData()
    setHistory([])
    if (selectedValidation === id) {
      setSelectedValidation(null)
    }
  }

  // View validation result and download report
  const handleViewValidation = (id: string) => {
    setSelectedValidation(id)
    router.push(`/validation/${id}`)
  }

  // Function to determine if requirements are not met
  const isRequirementsNotMet = (item: ValidationResponse): boolean => {
    // If the flag is explicitly set, use it
    if ('requirementsNotMet' in item && item.requirementsNotMet === true) {
      return true;
    }
    
    // Fall back to checking if all signatures are valid but document is invalid
    return !item.valid && 
           item.validSignatures === item.signatures && 
           item.signatures > 0;
  };

  // Function to determine the appropriate icon for a validation item
  const getStatusIcon = (item: ValidationResponse) => {
    if (item.valid) {
      return <CheckCircle size={24} color="#27ae60" />;
    }
    
    if (isRequirementsNotMet(item)) {
      return <AlertCircle size={24} color="#f59e0b" />;
    }
    
    return <AlertTriangle size={24} color="#e74c3c" />;
  };
  
  // Function to get appropriate color for status chip
  const getStatusColor = (item: ValidationResponse) => {
    if (item.valid) {
      return {
        bg: 'rgba(39, 174, 96, 0.1)',
        text: '#27ae60'
      };
    }
    
    if (isRequirementsNotMet(item)) {
      return {
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#f59e0b'
      };
    }
    
    return {
      bg: 'rgba(231, 76, 60, 0.1)',
      text: '#e74c3c'
    };
  };
  
  // Get status text for display
  const getStatusText = (item: ValidationResponse) => {
    if (item.valid) {
      return t('validDocument');
    }
    
    if (isRequirementsNotMet(item)) {
      return t('requirementsNotMet');
    }
    
    return t('invalidDocument');
  };

  return (
    <MainContent
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="history-container">
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
                onClick={() => router.push('/')}
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
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableCell width="5%" sx={{ fontWeight: 600 }}>{t('status')}</TableCell>
                    <TableCell width="35%" sx={{ fontWeight: 600 }}>{t('document')}</TableCell>
                    <TableCell width="20%" sx={{ fontWeight: 600 }}>{t('date')}</TableCell>
                    <TableCell width="15%" sx={{ fontWeight: 600 }}>{t('signatures')}</TableCell>
                    <TableCell width="25%" align="right" sx={{ fontWeight: 600 }}>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((batch) => (
                    batch.results.map((item) => (
                      <TableRow 
                        key={item.id}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: selectedValidation === item.id ? 'rgba(0,0,0,0.03)' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewValidation(item.id)}
                      >
                        <TableCell>
                          <div className="status-icon">
                            {getStatusIcon(item)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="document-name">
                            <span className="filename-text">{item.originalFile || item.filename}</span>
                            <Chip 
                              size="small"
                              label={getStatusText(item)}
                              sx={{ 
                                fontSize: '0.7rem',
                                bgcolor: getStatusColor(item).bg,
                                color: getStatusColor(item).text,
                                height: '20px',
                                ml: 1
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="validation-date">
                            {formatDate(batch.batch.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="signature-count">
                            {item.validSignatures}/{item.signatures}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleRemoveItem(batch.batch.id, e)}
                              sx={{ color: 'rgba(0,0,0,0.5)' }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
        
        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .document-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filename-text {
          font-weight: 500;
          color: rgba(0, 0, 0, 0.85);
        }
        
        .validation-date {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.85rem;
        }
        
        .signature-count {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.85rem;
        }
        
        @media (max-width: 768px) {
          .document-name {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .validation-date {
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          }
          
          .signature-count {
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          }
        }
      `}</style>
    </MainContent>
  )
} 