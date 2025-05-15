'use client'

import { useState, useEffect } from 'react'
import { 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  useTheme,
  Stack,
  TextField
} from '@mui/material'
import { 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import MainContent from '@/components/layout/MainContent'
import validationStorage from '@/utils/validationStorage'
import type { ValidationResponse } from '@/types/validation'
import type { BatchValidationResult } from '@/utils/validationStorage'
import { useTranslations } from 'next-intl'
import React from 'react'

export default function HistoryPage() {
  const [history, setHistory] = useState<BatchValidationResult[]>([])
  const [selectedValidation, setSelectedValidation] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const t = useTranslations('History')
  const theme = useTheme()

  // Load history from localStorage on component mount
  useEffect(() => {
    setHistory(validationStorage.getHistory())
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('default', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  // Handle clearing all history
  const handleClearHistory = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      validationStorage.clearValidationData()
      setHistory([])
    }
  }

  // View validation result
  const handleViewValidation = (id: string) => {
    setSelectedValidation(id)
    router.push(`/validation/${id}`)
  }

  // Function to determine if requirements are not met
  const isRequirementsNotMet = (item: ValidationResponse): boolean => {
    if ('requirementsNotMet' in item && item.requirementsNotMet === true) {
      return true;
    }
    return !item.valid && 
           item.validSignatures === item.signatures && 
           item.signatures > 0;
  };

  // Function to determine the appropriate icon for a validation item
  const getStatusIcon = (item: ValidationResponse) => {
    if (item.valid) {
      return <CheckCircle size={20} color="#27ae60" />;
    }
    if (isRequirementsNotMet(item)) {
      return <AlertCircle size={20} color="#f59e0b" />;
    }
    return <AlertTriangle size={20} color="#e74c3c" />;
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

  // Filtered history based on search
  const filteredHistory = history.map(batch => ({
    ...batch,
    results: batch.results.filter(item =>
      (item.filename || '').toLowerCase().includes(search.toLowerCase())
    )
  })).filter(batch => batch.results.length > 0)

  const renderDocumentCard = (item: ValidationResponse, timestamp: string) => (
    <Paper
      key={item.id}
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        bgcolor: selectedValidation === item.id ? 'action.selected' : 'background.paper'
      }}
      onClick={() => handleViewValidation(item.id)}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(item)}
          <Typography variant="subtitle1" sx={{ 
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '50ch'
          }}>
            {item.filename}
          </Typography>
          <Chip 
            size="small"
            label={getStatusText(item)}
            sx={{ 
              fontSize: '0.75rem',
              bgcolor: getStatusColor(item).bg,
              color: getStatusColor(item).text,
              height: '20px'
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={14} />
            <Typography variant="caption">
              {formatDate(timestamp)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UserCheck size={14} />
            <Typography variant="caption">
              {item.validSignatures}/{item.signatures} {t('signatures')}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );

  return (
    <MainContent
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="history-container">
        <Paper 
          elevation={2} 
          sx={{ 
            width: '100%', 
            maxWidth: 1400, 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder={t('searchPlaceholder') || 'Search documents...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ width: 220, mr: 3 }}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshCw size={16} />}
                onClick={() => router.push('/')}
                sx={{ textTransform: 'none' }}
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

          {filteredHistory.length === 0 ? (
            <Box sx={{ 
              py: 6, 
              px: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <Search size={40} color={theme.palette.text.secondary} />
              <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                {t('noHistoryTitle')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 3, color: 'text.secondary', maxWidth: 500 }}>
                {t('noHistoryDescription')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                startIcon={<FileText size={16} />}
                sx={{ textTransform: 'none' }}
              >
                {t('validateDocument')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {filteredHistory.map((batch) => (
                  <React.Fragment key={batch.batch.id}>
                    {batch.results.length === 1 ? (
                      renderDocumentCard(batch.results[0], batch.batch.timestamp)
                    ) : (
                      <Box sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 1.5
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          mb: 1.5,
                          px: 1
                        }}>
                          <FileText size={16} color={theme.palette.primary.main} />
                          <Typography variant="subtitle2" color="text.secondary">
                            {t('batchValidation')} - {formatDate(batch.batch.timestamp)}
                          </Typography>
                          <Chip 
                            size="small"
                            label={`${batch.batch.summary.validFiles}/${batch.batch.summary.totalFiles} ${t('valid')}`}
                            sx={{ 
                              fontSize: '0.75rem',
                              bgcolor: 'success.main',
                              color: 'white',
                              height: '20px'
                            }}
                          />
                        </Box>
                        <Stack spacing={1.5}>
                          {batch.results.map(item => renderDocumentCard(item, batch.batch.timestamp))}
                        </Stack>
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </Stack>
            </Box>
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
        
        @media (max-width: 768px) {
          .history-container {
            padding: 0.5rem;
          }
        }
      `}</style>
    </MainContent>
  )
} 