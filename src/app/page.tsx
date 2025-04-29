'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Paper } from '@mui/material'
import { FileCheck, RefreshCw, History, Loader2, FileText } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationResults from '@/components/features/validator/ValidationResults'
import BatchValidationResults from '@/components/features/validator/BatchValidationResults'
import ValidationSettingsPanel from '@/components/features/validator/ValidationSettingsPanel'
import type { ValidationResponse, SignerInfo, ValidationOptions } from '@/types/validation'
import type { ValidationDisplayData } from '@/components/features/validator/ValidationResults'
import validationHistory from '@/utils/validationHistory'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import '@/styles/batch-validation.css'
import { getValidationStatus } from '@/utils/validationUtils'

// Define an interface for our augmented validation data that includes settings
interface AugmentedValidationData extends ValidationResponse {
  filename: string;
  size: number;
  validationTimestamp: string;
  settings?: ValidationOptions;
}

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

export default function ValidatePage() {
  const t = useTranslations('Validator')
  const [isValidating, setIsValidating] = useState(false)
  const [validationComplete, setValidationComplete] = useState(false)
  const [validationData, setValidationData] = useState<AugmentedValidationData | null>(null)
  const [batchValidationData, setBatchValidationData] = useState<BatchValidationResult | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [signerInfo, setSignerInfo] = useState<SignerInfo[] | null>(null)
  const [isLoadingSigners, setIsLoadingSigners] = useState(false)
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

  // Fetch signer information when validation is complete and we have an ID
  useEffect(() => {
    async function fetchSignerInfo() {
      // Check if we have either a single file validation or a batch with one file
      const shouldFetchSingle = validationComplete && validationData?.id;
      const shouldFetchBatchSingle = validationComplete && batchValidationData && 
                                 batchValidationData.results?.length === 1 && 
                                 batchValidationData.results[0].id;
      
      let validationId: string | undefined;
      
      if (shouldFetchSingle && validationData) {
        validationId = validationData.id;
      } else if (shouldFetchBatchSingle && batchValidationData && batchValidationData.results[0]) {
        validationId = batchValidationData.results[0].id;
      }
      
      if (validationId) {
        console.log("Fetching signer info for validation:", validationId);
        setIsLoadingSigners(true);
        
        try {
          const response = await fetch(`/api/signers/${validationId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch signer info: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Received signer info:", data);
          setSignerInfo(data);
        } catch (err) {
          console.error('Error fetching signer info:', err);
        } finally {
          setIsLoadingSigners(false);
        }
      }
    }
    
    fetchSignerInfo();
  }, [validationComplete, validationData, batchValidationData]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsValidating(true);
    setError(null);
    setValidationComplete(false);
    setValidationData(null);
    setBatchValidationData(null);
    setSignerInfo(null);
    
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
        // Handle batch validation response
        setBatchValidationData(data);
        
        // Add each result to history using for...of loop instead of forEach
        for (const result of data.results) {
          if (result.id && result.originalFile) {
            // Determine if this is a case of requirements not met
            const status = getValidationStatus(result, data.batch.settings);
            
            validationHistory.addToHistory({
              id: result.id,
              filename: result.originalFile,
              timestamp: new Date().toISOString(),
              valid: result.valid,
              totalSignatures: result.signatures,
              validSignatures: result.validSignatures,
              requirementsNotMet: status === 'requirementsNotMet'
            });
          }
        }
        
      } else {
        // Single file validation - for backward compatibility
        const singleFileData = data as ValidationResponse;
        
        // Add additional metadata to the validation response
        const augmentedData: AugmentedValidationData = {
          ...singleFileData,
          filename: selectedFiles[0].name,
          size: selectedFiles[0].size,
          validationTimestamp: new Date().toISOString(),
          settings: validationSettings || undefined
        };
        
        // Determine if this is a case of requirements not met
        const status = getValidationStatus(singleFileData, validationSettings || undefined);
        
        // Save to validation history
        validationHistory.addToHistory({
          id: singleFileData.id,
          filename: selectedFiles[0].name,
          timestamp: new Date().toISOString(),
          valid: singleFileData.valid,
          totalSignatures: singleFileData.signatures,
          validSignatures: singleFileData.validSignatures,
          requirementsNotMet: status === 'requirementsNotMet'
        });
        
        // Update state for single file validation
        setValidationData(augmentedData);
      }
      
      setValidationComplete(true);
      
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationComplete(false)
    setValidationData(null)
    setBatchValidationData(null)
    setSelectedFiles([])
    setError(null)
    setSignerInfo(null)
    setValidationSettings(null)
  }

  // Modify mapToDisplayData to include settings from the response
  const mapToDisplayData = (data: AugmentedValidationData): ValidationDisplayData => {
    // Use settings from the response if available, otherwise use local settings
    const displaySettings = data.settings || validationSettings || {};
    
    return {
      id: data.id,
      valid: data.valid,
      filename: data.filename,
      size: data.size,
      timestamp: data.validationTimestamp,
      totalSignatures: data.signatures,
      validSignatures: data.validSignatures,
      quality: data.quality,
      legislation: data.legislation,
      longTermValidation: data.longTermValidation,
      visualDifferences: data.visualDifferences,
      undefinedChanges: data.undefinedChanges,
      // Add validation settings
      settingsQuality: displaySettings.quality,
      settingsLegislation: displaySettings.legislation,
      settingsLongTermValidation: displaySettings.longTermValidation,
      settingsRejectVisualDifferences: displaySettings.rejectVisualDifferences,
      settingsRejectUndefinedChanges: displaySettings.rejectUndefinedChanges
    };
  };

  // Save validation to history when validation is complete
  useEffect(() => {
    if (validationComplete && validationData) {
      // Determine if this is a case of requirements not met
      const status = getValidationStatus(validationData, validationData.settings);
      
      validationHistory.addToHistory({
        id: validationData.id,
        filename: validationData.filename,
        timestamp: validationData.validationTimestamp,
        valid: validationData.valid,
        totalSignatures: validationData.signatures,
        validSignatures: validationData.validSignatures,
        requirementsNotMet: status === 'requirementsNotMet'
      });
    }
  }, [validationComplete, validationData]);

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
                <div className="document-animation">
                  <FileText size={48} className="document-icon" />
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
      
      {validationComplete && !error && (
        <Box sx={{ mb: 3 }}>
          {batchValidationData && batchValidationData.results.length > 1 ? (
            <BatchValidationResults 
              results={batchValidationData.results}
              batchInfo={batchValidationData.batch}
            />
          ) : (
            <ValidationResults 
              validation={
                batchValidationData && batchValidationData.results.length === 1 
                  ? mapToDisplayData({
                      ...batchValidationData.results[0],
                      filename: batchValidationData.results[0].originalFile || '',
                      size: ('size' in batchValidationData.results[0]) 
                        ? (batchValidationData.results[0] as ValidationResponse & { originalFile?: string; size: number }).size 
                        : 0,
                      validationTimestamp: new Date().toISOString(),
                      settings: batchValidationData.batch.settings
                    })
                  : validationData ? mapToDisplayData(validationData) : null
              }
              signerInfo={signerInfo}
              isLoadingSigners={isLoadingSigners}
            />
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              startIcon={<RefreshCw size={16} />}
              onClick={resetValidation}
              sx={{ px: 4, py: 1.5 }}
            >
              {t('validateAnother')}
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