'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Paper } from '@mui/material'
import { FileCheck, RefreshCw, History, Loader2 } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationSettingsPanel from '@/components/features/validator/ValidationSettingsPanel'
import type { ValidationResponse, ValidationOptions } from '@/types/validation'
import validationHistory from '@/utils/validationHistory'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import '@/styles/batch-validation.css'
import { getValidationStatus } from '@/utils/validationUtils'

// Batch validation result type
interface BatchValidationResult {
  batch: {
    summary: {
      totalFiles: number;
      validFiles: number;
      invalidFiles: number;
      errorFiles: number;
    },
    settings?: ValidationOptions;
  },
  results: (ValidationResponse & { 
    originalFile?: string;
    error?: string | null; 
  })[];
}

// Define the type for stored validation data
interface StoredValidationData {
  [id: string]: ValidationResponse & { 
    filename?: string;
    size?: number;
    validationTimestamp?: string;
    settings?: ValidationOptions;
    [key: string]: unknown;  // Add index signature to make compatible with Record<string, unknown>
  };
}

// Create a new validation storage service to store complete validation data
const validationStorage = {
  // Store complete validation data
  saveValidationData: (id: string, data: ValidationResponse & Record<string, unknown>): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get existing validation data
      const existingDataStr = localStorage.getItem('validationData') || '{}';
      const existingData = JSON.parse(existingDataStr) as StoredValidationData;
      
      // Add new validation data
      existingData[id] = data;
      
      // Save back to localStorage
      localStorage.setItem('validationData', JSON.stringify(existingData));
      console.log(`Saved complete validation data for ID: ${id}`);
    } catch (err) {
      console.error('Error saving validation data to localStorage:', err);
    }
  },
  
  // Save batch validation data
  saveBatchValidationData: (batchData: BatchValidationResult): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('batchValidationData', JSON.stringify(batchData));
      console.log('Saved batch validation data to localStorage');
    } catch (err) {
      console.error('Error saving batch validation data to localStorage:', err);
    }
  },
  
  // Get batch validation data
  getBatchValidationData: (): BatchValidationResult | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const dataStr = localStorage.getItem('batchValidationData');
      if (!dataStr) return null;
      return JSON.parse(dataStr) as BatchValidationResult;
    } catch (err) {
      console.error('Error getting batch validation data from localStorage:', err);
      return null;
    }
  },
  
  // Get validation data by ID
  getValidationData: (id: string): (ValidationResponse & Record<string, unknown>) | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const dataStr = localStorage.getItem('validationData') || '{}';
      const data = JSON.parse(dataStr) as StoredValidationData;
      return data[id] || null;
    } catch (err) {
      console.error('Error getting validation data from localStorage:', err);
      return null;
    }
  },
  
  // Clear all validation data
  clearValidationData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('validationData');
  }
};

export default function ValidatePage() {
  const t = useTranslations('Validator')
  const [isValidating, setIsValidating] = useState(false)
  const [validationComplete, setValidationComplete] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Get validation settings from localStorage if available
  const [validationSettings, setValidationSettings] = useState<ValidationOptions | null>(null);
  
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsValidating(true);
    setError(null);
    setValidationComplete(false);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // For batch validation, append files with unique keys
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      // Add validation settings if available
      if (validationSettings) {
        formData.append('settings', JSON.stringify(validationSettings));
      }
      
      // Send request to API
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('validationError'));
      }
      
      const data = await response.json();
      
      // Check if this is a batch validation response
      if (data.batch && Array.isArray(data.results)) {
        // Handle batch validation
        handleBatchValidation(data as BatchValidationResult);
      } else {
        // Single file validation
        await handleSingleValidation(data as ValidationResponse);
      }
      
      setValidationComplete(true);
      
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle single file validation
  const handleSingleValidation = async (validationResponse: ValidationResponse) => {
    // Add additional metadata to the validation response
    const augmentedData = {
      ...validationResponse,
      filename: selectedFiles[0].name,
      size: selectedFiles[0].size,
      validationTimestamp: new Date().toISOString(),
      settings: validationSettings || undefined
    };
    
    // Determine if this is a case of requirements not met
    const status = getValidationStatus(validationResponse, validationSettings || undefined);
    
    // Save to validation history
    validationHistory.addToHistory({
      id: validationResponse.id,
      filename: selectedFiles[0].name,
      timestamp: new Date().toISOString(),
      valid: validationResponse.valid,
      totalSignatures: validationResponse.signatures,
      validSignatures: validationResponse.validSignatures,
      requirementsNotMet: status === 'requirementsNotMet'
    });
    
    // Save full validation data to localStorage
    validationStorage.saveValidationData(validationResponse.id, augmentedData);
    
    // After saving, redirect to validation results page
    router.push(`/validation/${validationResponse.id}`);
  };
  
  // Handle batch validation response
  const handleBatchValidation = (batchData: BatchValidationResult) => {
    console.log("Processing batch validation results:", batchData.results.length);
    
    // Save the batch data for access in the validation page
    validationStorage.saveBatchValidationData(batchData);
    
    // Add each result to history and storage
    for (const result of batchData.results) {
      if (result.id && result.originalFile) {
        // Determine if this is a case of requirements not met
        const status = getValidationStatus(result, batchData.batch.settings);
        
        // Add to history
        validationHistory.addToHistory({
          id: result.id,
          filename: result.originalFile,
          timestamp: new Date().toISOString(),
          valid: result.valid,
          totalSignatures: result.signatures,
          validSignatures: result.validSignatures,
          requirementsNotMet: status === 'requirementsNotMet'
        });
        
        // Augment data with additional info
        const augmentedData = {
          ...result,
          filename: result.originalFile,
          validationTimestamp: new Date().toISOString(),
          settings: batchData.batch.settings
        };
        
        // Save full validation data to localStorage
        validationStorage.saveValidationData(result.id, augmentedData);
      }
    }
    
    // For batch validation with results, redirect to the first validation result
    if (batchData.results.length > 0 && batchData.results[0].id) {
      // Redirect to the first result, with a query param to indicate this is part of a batch
      router.push(`/validation/${batchData.results[0].id}?batch=true`);
    } else {
      // Fallback to history if no results
      router.push('/history');
    }
  };

  const resetValidation = () => {
    setValidationComplete(false);
    setSelectedFiles([]);
    setError(null);
    setValidationSettings(null);
  };

  return (
    <MainContent
      title={t('title')}
      description={t('description')}
      icon={<FileCheck />}
    >
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
      
      {isValidating && (
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
                  {selectedFiles.length > 1 
                    ? t('validatingBatch', { count: selectedFiles.length }) 
                    : t('validatingDocument')}
                </h3>
                <div className="progress-bar">
                  <div className="progress-bar-inner" />
                </div>
                <p className="validating-description">
                  {t('validatingDescription')}
                </p>
                <p className="validating-files-info">
                  {t('processingFiles')}
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