'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Paper } from '@mui/material'
import { FileCheck, RefreshCw, History, Loader2 } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationSettingsPanel from '@/components/features/validator/ValidationSettingsPanel'
import type { ValidationResponse, ValidationOptions } from '@/types/validation'
import validationHistory from '@/utils/validationHistory'
import signingStorage from '@/utils/signingStorage'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import '@/styles/batch-validation.css'
import { getValidationStatus } from '@/utils/validationUtils'

// Batch validation result type
interface BatchValidationResult {
  batch: {
    id?: string;
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
    } catch (err) {
      console.error('Error saving validation data to localStorage:', err);
    }
  },
  
  // Save batch validation data
  saveBatchValidationData: (batchData: BatchValidationResult): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('batchValidationData', JSON.stringify(batchData));
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
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const router = useRouter()
  
  // Get validation settings from localStorage if available
  const [validationSettings, setValidationSettings] = useState<ValidationOptions | null>(null);

  // Check for returning from the onboarding flow with a document to validate
  useEffect(() => {
    const loadSignedDocument = async () => {
      const shouldValidateSignedDocument = localStorage.getItem('validateSignedDocument') === 'true';
      
      console.log('Checking for signed document to validate:', shouldValidateSignedDocument);
      
      if (shouldValidateSignedDocument && selectedFiles.length === 0) {
        console.log('Attempting to load signed document for validation');
        setIsLoadingDocument(true);
        
        try {
          const activeRequestId = signingStorage.getActiveRequest();
          console.log('Active request ID:', activeRequestId);
          
          if (activeRequestId) {
            // First check if document is stored in signing storage
            let documentContent = signingStorage.getDocumentContent(activeRequestId);
            console.log('Document content from storage:', documentContent ? `Found (${documentContent.length} bytes)` : 'Not found');
            
            // Get request data to find document ID (we need this regardless)
            const requestData = signingStorage.getSignatureData(activeRequestId);
            console.log('Signature request data:', requestData ? 'Found' : 'Not found', requestData?.document_id ? `(document_id: ${requestData.document_id})` : '');
            
            // If coming from onboarding flow or content is missing, always fetch fresh document from API
            if (!documentContent || localStorage.getItem('validateSignedDocument') === 'true') {

              // Check for document ID in different possible property names
              const docId = requestData?.document_id || 
                           (requestData?.documents?.[0]?.id) || 
                           (Array.isArray(requestData?.documents_ids) ? requestData?.documents_ids[0] : undefined);
              
      

              if (docId) {
                // Fetch document content from API
                const documentResponse = await fetch(`/api/signing/document/${docId}?format=json`);
                
                if (documentResponse.ok) {
                  const documentData = await documentResponse.json();

                  if (documentData.content) {
                    documentContent = documentData.content;
                    // Save document content for future use
                    if (documentContent) {
                      signingStorage.saveDocumentContent(activeRequestId, documentContent);
                    }
                  }
                } else {
                  console.error("Failed to fetch document from API:", documentResponse.status);
                }
              }
            }
            
            // Convert document content to File object if found
            if (documentContent) {
              // Check if the content seems like a valid PDF (should be larger than 1KB at minimum)
              if (documentContent.length < 1000) {
                console.warn("Document content seems too small for a valid PDF, attempting to fetch from API");
                
                // Check for document ID in different possible property names
                const docId = requestData?.document_id || 
                            (requestData?.documents?.[0]?.id) || 
                            (Array.isArray(requestData?.documents_ids) ? requestData?.documents_ids[0] : undefined);
                
                if (docId) {
                  // Try to fetch document content from API as fallback
                  const documentResponse = await fetch(`/api/signing/document/${docId}?format=json`);
                  
                  if (documentResponse.ok) {
                    const documentData = await documentResponse.json();
                    if (documentData.content && documentData.content.length > 1000) {
                      documentContent = documentData.content;
                      // Use type assertion to ensure TypeScript knows documentContent is a string
                      signingStorage.saveDocumentContent(activeRequestId, documentContent as string);
                    } else {
                      console.error("API returned invalid or small document content");
                      setError("Could not load a valid signed document from the API.");
                      setIsLoadingDocument(false);
                      return;
                    }
                  } else {
                    console.error("Failed to fetch document as fallback:", documentResponse.status);
                    setError("Could not load the signed document. Please upload it manually.");
                    setIsLoadingDocument(false);
                    return;
                  }
                } else {
                  console.error("No document ID available for fallback fetch");
                  setError("Could not find document ID. Please upload the document manually.");
                  setIsLoadingDocument(false);
                  return;
                }
              }
              
              try {
                // Since we're inside the if(documentContent) block, we can safely cast to string
                const content = documentContent as string;
                const base64Data = content.includes('data:') 
                  ? content.split(',')[1] 
                  : content;
                
                // Create a blob directly from base64
                const binary = atob(base64Data);
                const array = [];
                for (let i = 0; i < binary.length; i++) {
                  array.push(binary.charCodeAt(i));
                }
                
                // Create blob from binary data
                const blob = new Blob([new Uint8Array(array)], {type: 'application/pdf'});
                
                // Create a File object
                const file = new File([blob], `signed-document-${activeRequestId}.pdf`, {type: 'application/pdf'});
                // Add the file to the state
                setSelectedFiles([file]);
                
                // Clear the flag so we don't keep trying to load on subsequent renders
                localStorage.removeItem('validateSignedDocument');
              } catch (error) {
                console.error("Error creating file object:", error);
                setError("Error creating the signed document file. Please upload it manually.");
              }
            } else {
              console.error("No document content found");
              setError("Could not load the signed document. Please upload it manually.");
            }
          }
        } catch (error) {
          console.error("Error loading signed document:", error);
          setError("Error loading the signed document. Please upload it manually.");
        } finally {
          setIsLoadingDocument(false);
        }
      }
    };
    
    loadSignedDocument();
  }, [selectedFiles.length]);

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
      
      // Check if this is a batch validation response structure
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
    // Make sure we have a valid ID
    if (!validationResponse.id) {
      console.error('Validation response missing ID:', validationResponse);
      setError(t('missingValidationId'));
      return;
    }
    
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
    
    // Check if we need to show success dialog (coming from onboarding flow)
    const validateSignedFlag = localStorage.getItem('validateSignedDocument');
    
    if (validateSignedFlag === 'true') {
      localStorage.setItem('showSuccessAfterValidation', 'true');
      
      // DEBUG: Explicitly set flag values to make sure they're correct
      localStorage.setItem('validateSignedDocument', 'true');
      localStorage.setItem('showSuccessAfterValidation', 'true');
      
      router.push(`/validation/${validationResponse.id}?fromOnboarding=true`);
    } else {
      // After saving, redirect to validation results page without parameter
      router.push(`/validation/${validationResponse.id}`);
    }
  };
  
  // Handle batch validation response
  const handleBatchValidation = (batchData: BatchValidationResult) => {
    
    // Check if this is coming from onboarding
    const validateSignedFlag = localStorage.getItem('validateSignedDocument');
    
    // Generate a unique batch ID if not already present
    const batchId = batchData.batch.id || `batch-${Date.now()}`;
    
    // Add batch ID to the data
    const batchDataWithId = {
      ...batchData,
      batch: {
        ...batchData.batch,
        id: batchId
      }
    };
    
    // Save the batch data for access in the validation page
    validationStorage.saveBatchValidationData(batchDataWithId);
    
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
          settings: batchData.batch.settings,
          batchId: batchData.results.length > 1 ? batchId : undefined // Only add batchId for actual batches
        };
        
        // Save full validation data to localStorage
        validationStorage.saveValidationData(result.id, augmentedData);
      }
    }
    
    // Handle success dialog if coming from onboarding
    if (validateSignedFlag === 'true') {
      localStorage.setItem('showSuccessAfterValidation', 'true');
      
      // For batch validation with results, redirect to the first validation result
      if (batchData.results.length > 0 && batchData.results[0].id) {
        const url = `/validation/${batchData.results[0].id}?fromOnboarding=true`;
        router.push(url);
        return;
      }
    }
    
    // Normal flow (not from onboarding)
    // For batch validation with results, redirect to the first validation result
    if (batchData.results.length > 0 && batchData.results[0].id) {
      // Only add batch=true parameter if there are multiple results
      const url = batchData.results.length > 1
        ? `/validation/${batchData.results[0].id}?batch=true`
        : `/validation/${batchData.results[0].id}`;
      
      router.push(url);
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