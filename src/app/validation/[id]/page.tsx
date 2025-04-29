'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Button, Alert, AlertTitle, Box, CircularProgress } from '@mui/material'
import { FileCheck, RefreshCw, History, ArrowLeft } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import ValidationResults from '@/components/features/validator/ValidationResults'
import BatchValidationResults from '@/components/features/validator/BatchValidationResults'
import type { ValidationResponse, SignerInfo, ValidationOptions } from '@/types/validation'
import type { ValidationDisplayData } from '@/components/features/validator/ValidationResults'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getValidationStatus } from '@/utils/validationUtils'
import validationHistory from '@/utils/validationHistory'
import validationStorage from '@/utils/validationStorage'

// Define an interface for our augmented validation data that includes settings
interface AugmentedValidationData extends ValidationResponse {
  filename: string;
  size: number;
  validationTimestamp: string;
  settings?: ValidationOptions;
  requirementsNotMet?: boolean;
  batchId?: string; // New field to track if validation is part of a batch
}

// Extend ValidationDisplayData to include requirementsNotMet
interface ExtendedValidationDisplayData extends ValidationDisplayData {
  requirementsNotMet?: boolean;
}

export default function ValidationByIdPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>);
  const validationId = unwrappedParams.id;
  
  const t = useTranslations('Validator')
  const [isLoading, setIsLoading] = useState(true)
  const [validationData, setValidationData] = useState<AugmentedValidationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signerInfo, setSignerInfo] = useState<SignerInfo[] | null>(null)
  const [isBatchValidation, setIsBatchValidation] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<(ValidationResponse & { originalFile?: string; error?: string | null })[]>([])
  const [batchSummary, setBatchSummary] = useState<{ 
    totalFiles: number; 
    validFiles: number; 
    invalidFiles: number; 
    errorFiles: number; 
  } | null>(null)
  const [batchSettings, setBatchSettings] = useState<ValidationOptions | undefined>(undefined)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Fetch validation data by ID when the component mounts
  useEffect(() => {
    async function fetchValidation() {
      if (!validationId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // First check if we have the full validation data stored
        const storedData = validationStorage.getValidationData(validationId);
        console.log('Found stored validation data:', storedData ? 'Yes' : 'No');
        
        if (storedData) {
          console.log('Using stored validation data:', storedData);
          
          // Check if this validation is part of a batch
          const validateBatchId = storedData.batchId as string;
          let checkForBatch = false;
          
          // Only consider it a batch if we have multiple results
          if (validateBatchId) {
            const batchData = validationStorage.getBatchById(validateBatchId);
            checkForBatch = !!(batchData && Array.isArray(batchData.results) && batchData.results.length > 1);
          } else if (searchParams.get('batch') === 'true') {
            // Legacy support for the batch parameter - only if we have multiple results
            const batchData = validationStorage.getBatchValidationData();
            checkForBatch = !!(batchData && Array.isArray(batchData.results) && batchData.results.length > 1);
          }
          
          if (checkForBatch) {
            console.log('This validation is part of a batch:', validateBatchId);
            setIsBatchValidation(true);
            
            if (validateBatchId) {
              setBatchId(validateBatchId);
              
              // Get the batch data
              const batchData = validationStorage.getBatchById(validateBatchId);
              if (batchData) {
                setBatchResults(batchData.results);
                setBatchSummary(batchData.batch.summary);
                setBatchSettings(batchData.batch.settings);
                
                // Store the batch ID for potential future API calls or navigation
                console.log(`Using batch ID ${validateBatchId} for validation ${validationId}`);
              } else {
                // If we can't find the batch, we fall back to showing this as a single validation
                console.log('Could not find batch data, showing as single validation');
                setIsBatchValidation(false);
                setBatchId(null);
              }
            } else {
              // Legacy support for the old batch=true query param
              const batchData = validationStorage.getBatchValidationData();
              if (batchData?.results?.some(r => r.id === validationId)) {
                const legacyBatchId = batchData.batch.id || `legacy-batch-${Date.now()}`;
                setBatchId(legacyBatchId);
                setBatchResults(batchData.results);
                setBatchSummary(batchData.batch.summary);
                setBatchSettings(batchData.batch.settings);
                console.log(`Using legacy batch ID ${legacyBatchId} for validation ${validationId}`);
              } else {
                setIsBatchValidation(false);
                setBatchId(null);
              }
            }
          }
          
          // Extract signers if available
          const signersArray = storedData.signers as SignerInfo[] || [];
          if (signersArray.length > 0) {
            console.log('Setting signer info from stored data:', signersArray.length);
            setSignerInfo(signersArray);
          }
          
          // Convert stored data to our expected format
          const storedValidation = storedData as unknown as AugmentedValidationData;
          
          setValidationData(storedValidation);
          setIsLoading(false);
          return;
        }
        
        // If no stored data, fetch from API
        console.log('Fetching validation data for ID:', validationId);
        
        // Also check history for additional info
        const historyItems = validationHistory.getHistory();
        const historyItem = historyItems.find(item => item.id === validationId);
        
        if (historyItem) {
          console.log('Found history data:', historyItem);
        }
        
        // Fetch validation data from our API endpoint
        const response = await fetch(`/api/validation/${validationId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('validationError'));
        }
        
        // Log full API response for debugging
        const data = await response.json();
        console.log('Raw API response:', JSON.stringify(data, null, 2));
        
        // Extract signers if available
        const signersArray = data.signers || [];
        if (signersArray.length > 0) {
          console.log('Found signers:', signersArray.length);
          setSignerInfo(signersArray);
        }
        
        // Override data.valid if appropriate - sometimes the API and history disagree
        const dataValid = data.valid || 
                         (data.indication === "TOTAL-PASSED") || 
                         (data.validSignatures === data.signatures && data.signatures > 0);
        
        // Prepare validation data with filename
        const validationWithFilename: AugmentedValidationData = {
          ...data,
          // Use filename from history if available, otherwise use from API or fallback
          filename: historyItem?.filename || data.originalFile || data.filename || `document-${validationId}`,
          size: data.size || 0,
          validationTimestamp: data.timestamp || historyItem?.timestamp || new Date().toISOString(),
          // Make sure signatures and validSignatures get set if they're missing
          signatures: data.signatures || (signersArray?.length || 0),
          validSignatures: data.validSignatures !== undefined ? data.validSignatures : 
                         (signersArray?.filter((s: SignerInfo) => s.valid).length || 0),
          // Set valid flag combining data sources
          valid: dataValid,
          // Get requirements not met from history
          requirementsNotMet: historyItem?.requirementsNotMet
        };
        
        console.log('Processed validation data:', validationWithFilename);
        setValidationData(validationWithFilename);
      } catch (err) {
        console.error('Error fetching validation:', err);
        setError(err instanceof Error ? err.message : t('unknownError'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchValidation();
  }, [validationId, t, searchParams]);

  // Modify mapToDisplayData to include settings from the response
  const mapToDisplayData = (data: AugmentedValidationData): ExtendedValidationDisplayData => {
    // Use settings from the response if available
    const displaySettings = data.settings || {};
    
    // Calculate status from validation data if requirements not met flag isn't already set
    const validationStatus = data.requirementsNotMet !== undefined 
      ? (data.requirementsNotMet ? 'requirementsNotMet' : (data.valid ? 'valid' : 'invalid'))
      : getValidationStatus(data, displaySettings);
      
    const isValid = validationStatus === 'valid';
    const isRequirementsNotMet = validationStatus === 'requirementsNotMet';
    
    console.log('Mapping validation status:', {
      apiValid: data.valid,
      calculatedStatus: validationStatus,
      isValid,
      isRequirementsNotMet
    });
    
    return {
      id: data.id,
      valid: isValid,
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
      settingsRejectUndefinedChanges: displaySettings.rejectUndefinedChanges,
      // Add requirements not met flag
      requirementsNotMet: isRequirementsNotMet
    };
  };

  return (
    <MainContent
      title={t('resultsTitle')}
      description={t('resultsDescription')}
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
              onClick={() => router.refresh()}
            >
              {t('tryAgain')}
            </Button>
          }
        >
          <AlertTitle>{t('validationFailed')}</AlertTitle>
          {error}
        </Alert>
      )}
      
      {isLoading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 10,
          textAlign: 'center'
        }}>
          <CircularProgress size={60} sx={{ mb: 3, color: '#e74c3c' }} />
          <AlertTitle sx={{ fontSize: '1.25rem', mb: 1 }}>
            {t('loadingResults')}
          </AlertTitle>
          <Box sx={{ color: 'text.secondary', maxWidth: 400 }}>
            {t('loadingDescription')}
          </Box>
        </Box>
      )}
      
      {!isLoading && !error && validationData && (
        <Box sx={{ mb: 3 }}>
          {isBatchValidation && batchSummary && batchResults.length > 0 ? (
            <BatchValidationResults
              results={batchResults}
              batchInfo={{
                summary: batchSummary,
                settings: batchSettings
              }}
            />
          ) : (
            <ValidationResults 
              validation={mapToDisplayData(validationData)}
              signerInfo={signerInfo}
              isLoadingSigners={false}
            />
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              sx={{ px: 3, py: 1 }}
            >
              {t('validateAnother')}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<History size={16} />}
              onClick={() => router.push('/history')}
              sx={{ px: 3, py: 1 }}
            >
              {t('viewHistory')}
            </Button>
          </Box>
        </Box>
      )}
    </MainContent>
  )
} 