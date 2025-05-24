'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Paper } from '@mui/material'
import { FileCheck, RefreshCw, History, Loader2 } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationSettingsPanel from '@/components/features/validator/ValidationSettingsPanel'
import type { ValidationResponse, ValidationOptions } from '@/types/validation'
import type { BatchValidationResult } from '@/utils/validationStorage'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import '@/styles/batch-validation.css'
import validationStorage from '@/utils/validationStorage'
import AuthDialog from '@/components/features/validator/AuthDialog'
import { useAuth } from '@/contexts/AuthContext'

export default function ValidatePage() {
  const t = useTranslations('Validator')
  const [isValidating, setIsValidating] = useState(false)
  const [validationComplete, setValidationComplete] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingDocument ] = useState(false)
  const router = useRouter()
  
  // Get validation settings from localStorage if available
  const [validationSettings, setValidationSettings] = useState<ValidationOptions | null>(null);

  const { isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {    
    // Retrieve settings from localStorage when component mounts
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('validationSettings');
      if (savedSettings) {
        try {
          setValidationSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse validation settings:', e);
        }
      }
    }
  }, []);

  // Handle file upload
  const handleUpload = async () => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (selectedFiles.length === 0) {
      setError(t('noFilesSelected'));
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Always use batch endpoint, even for single files
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('file', file);
      }
      
      // Add validation settings if available
      if (validationSettings) {
        formData.append('settings', JSON.stringify(validationSettings));
      }

      const response = await fetch('/api/validation', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(t('validationError'));
      }

      const batchData = await response.json();
      console.log('Received batch validation response:', batchData);
      
      // Always handle as batch
      handleBatchValidation(batchData);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsValidating(false);
    }
  };

  // Handle batch validation
  const handleBatchValidation = (batchData: BatchValidationResult) => {
    // Generate a batch ID if one doesn't exist
    if (!batchData.batch.id) {
      batchData.batch.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Add required fields
    batchData.batch.timestamp = new Date().toISOString();
    batchData.batch.validationIds = batchData.results.map((r: ValidationResponse) => r.id).filter(Boolean) as string[];

    // Add settings to batch data
    if (validationSettings) {
      batchData.batch.settings = validationSettings;
    }

    // Ensure each result has an ID and XML report
    batchData.results = batchData.results.map(result => ({
      ...result,
      id: result.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      xmlReport: (result as ValidationResponse & { xmlReport?: string }).xmlReport || ''
    }));

    // Save batch data
    validationStorage.saveBatchValidationData(batchData);

    // Navigate to the first validation result
    if (batchData.results.length > 0) {
      router.push(`/validation/${batchData.results[0].id}`);
    }
  };

  // Reset validation state
  const resetValidation = () => {
    setSelectedFiles([]);
    setError(null);
    setValidationComplete(false);
  };

  return (
    <MainContent
      title={t('title')}
      description={t('description')}
      icon={<FileCheck />}
    >
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshCw size={16} />}
              onClick={resetValidation}
            >
              {t('tryAgain')}
            </Button>
          }
        >
          <AlertTitle>{t('validationFailed')}</AlertTitle>
          {error}
        </Alert>
      )}
      
      {(isValidating || isLoadingDocument) && (
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              bgcolor: 'background.paper',
              overflow: 'hidden',
              p: 5,
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="validating-state">
              <div className="validating-animation">
                <div className="spinner-container">
                  <Loader2 size={90} className="spinner" />
                </div>
              </div>
              <div className="validating-content">
                <h3 className="validating-title">
                  {isLoadingDocument 
                    ? 'Loading Signed Document'
                    : selectedFiles.length > 1 
                      ? t('validatingBatch', { count: selectedFiles.length }) 
                      : t('validatingDocument')}
                </h3>
                <div className="progress-bar">
                  <div className="progress-bar-inner" />
                </div>
                <p className="validating-description">
                  {isLoadingDocument 
                    ? 'Preparing your signed document for validation...'
                    : t('validatingDescription') || 'Validating your document...'}
                </p>
                <p className="validating-files-info">
                  {isLoadingDocument 
                    ? 'This will only take a moment'
                    : t('processingFiles') || 'Processing your files'}
                </p>
              </div>
            </div>
          </Paper>
        </Box>
      )}
      
      {!validationComplete && !isValidating && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mt: 2, mb: 5 }}>
            <DocumentUploader 
              onFilesSelect={setSelectedFiles}
              selectedFiles={selectedFiles}
              isValidating={isValidating}
            />
          </Box>
          
          <ValidationSettingsPanel 
            settings={validationSettings}
            onSettingsChange={(settings) => {
              setValidationSettings(settings);
              // Save to localStorage
              localStorage.setItem('validationSettings', JSON.stringify(settings));
            }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<History size={16} />}
              onClick={() => router.push('/history')}
              sx={{ minWidth: '120px' }}
            >
              {t('viewHistory')}
            </Button>
            
            <Button
              variant="contained"
              disabled={selectedFiles.length === 0 || isValidating}
              onClick={handleUpload}
              sx={{ 
                px: 5, 
                py: 1.5, 
                minWidth: '180px',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              {isValidating ? t('validating') : selectedFiles.length > 1 ? t('validateBatch') : t('validate')}
            </Button>
          </Box>
        </Box>
      )}
      
      <style jsx global>{`
        .validating-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          text-align: center;
        }
        
        .validating-animation {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto 2rem;
        }
        
        .spinner-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .spinner {
          animation: spin 2s linear infinite;
          color: #e74c3c;
          opacity: 0.7;
        }
        
        .document-animation {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .document-icon {
          color: #1a2238;
        }
        
        .validating-content {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .validating-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #1a2238;
        }
        
        .progress-bar {
          height: 6px;
          background-color: #f1f1f1;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }
        
        .progress-bar-inner {
          height: 100%;
          width: 30%;
          background-color: #e74c3c;
          border-radius: 3px;
          animation: progress 2s ease-in-out infinite;
        }
        
        .validating-description {
          font-size: 1.2rem;
          color: #555;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .validating-files-info {
          font-size: 1rem;
          color: #777;
          font-style: italic;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </MainContent>
  )
} 