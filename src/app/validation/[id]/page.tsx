'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Button, Alert, AlertTitle, Box, CircularProgress } from '@mui/material'
import { FileCheck, RefreshCw, History, ArrowLeft } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import ValidationResults from '@/components/features/validator/ValidationResults'
import BatchValidationResults from '@/components/features/validator/BatchValidationResults'
import SuccessDialog from '@/components/features/dialogs/SuccessDialog'
import type { ValidationResponse, SignerInfo, ValidationOptions } from '@/types/validation'
import type { ValidationDisplayData } from '@/components/features/validator/ValidationResults'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import validationStorage from '@/utils/validationStorage'

// Define an interface for our augmented validation data that includes settings
interface AugmentedValidationData extends ValidationResponse {
  filename: string;
  size: number;
  validationTimestamp: string;
  settings?: ValidationOptions;
  requirementsNotMet?: boolean;
  batchId?: string;
  originalFile?: string;
}

// Extend ValidationDisplayData to include requirementsNotMet
interface ExtendedValidationDisplayData extends ValidationDisplayData {
  requirementsNotMet?: boolean;
}

// Add interface for stored data
interface StoredValidationData extends ValidationResponse {
  filename?: string;
  size?: number;
  validationTimestamp?: string;
  settings?: ValidationOptions;
  batchId?: string;
  originalFile?: string;
}

// Add interface for batch result
interface BatchResult extends ValidationResponse {
  originalFile?: string;
  error?: string | null;
  size?: number;
}

export default function ValidationByIdPage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>);
  const validationId = unwrappedParams.id;
  
  const t = useTranslations('Validator')
  const [isLoading, setIsLoading] = useState(true)
  const [validationData, setValidationData] = useState<AugmentedValidationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signerInfo, setSignerInfo] = useState<SignerInfo[] | null>(null)
  const [isBatchValidation, setIsBatchValidation] = useState(false)
  const [batchResults, setBatchResults] = useState<(ValidationResponse & { originalFile?: string; error?: string | null })[]>([])
  const [batchSummary, setBatchSummary] = useState<{ 
    totalFiles: number; 
    validFiles: number; 
    invalidFiles: number; 
    errorFiles: number; 
  } | null>(null)
  const [batchSettings, setBatchSettings] = useState<ValidationOptions | undefined>(undefined)
  const [batchResultIndex, setBatchResultIndex] = useState<number | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Force the success dialog to show when we detect this is from onboarding
  useEffect(() => {
    const validateFlag = localStorage.getItem('validateSignedDocument');
    const fromOnboardingParam = searchParams?.get('fromOnboarding');
    
    if (validateFlag === 'true' || fromOnboardingParam === 'true') {
      localStorage.setItem('showSuccessAfterValidation', 'true');
      
      if (validateFlag === 'true') {
        localStorage.removeItem('validateSignedDocument');
      }
    }
  }, [searchParams]);
  
  // Load validation data from storage when the component mounts
  useEffect(() => {
    if (!validationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get validation data from storage
      const storedData = validationStorage.getValidationData(validationId);
      
      if (!storedData) {
        setError(t('validationNotFound'));
        setIsLoading(false);
        return;
      }

      // Check if this validation is part of a batch
      const validateBatchId = storedData.batchId as string;
      let checkForBatch = false;
      
      if (validateBatchId) {
        const batchData = validationStorage.getBatchById(validateBatchId);
        if (batchData) {
          // Use batch data for validation info
          const batchResult = batchData.results.find(r => r.id === validationId) as BatchResult;
          if (batchResult) {
            const augmentedData: AugmentedValidationData = {
              ...batchResult,
              filename: batchResult.originalFile || batchResult.filename || '',
              size: batchResult.size || 0,
              validationTimestamp: batchData.batch.timestamp,
              settings: batchData.batch.settings,
              batchId: validateBatchId,
              originalFile: batchResult.originalFile
            };
            setValidationData(augmentedData);
            setSignerInfo(batchResult.additionalInfos?.signer || []);
            
            // Set batch data for batch view
            setBatchResults(batchData.results as BatchResult[]);
            setBatchSummary(batchData.batch.summary);
            setBatchSettings(batchData.batch.settings);
            const currentResultIndex = batchData.results.findIndex(r => r.id === validationId);
            if (currentResultIndex > -1) {
              setBatchResultIndex(currentResultIndex);
            }
          }
          checkForBatch = batchData.results.length > 1;
        }
      } else if (searchParams?.get('batch') === 'true') {
        const batchData = validationStorage.getBatchValidationData();
        if (batchData?.results?.some(r => r.id === validationId)) {
          const batchResult = batchData.results.find(r => r.id === validationId) as BatchResult;
          if (batchResult) {
            const augmentedData: AugmentedValidationData = {
              ...batchResult,
              filename: batchResult.originalFile || batchResult.filename || '',
              size: batchResult.size || 0,
              validationTimestamp: batchData.batch.timestamp,
              settings: batchData.batch.settings,
              batchId: batchData.batch.id,
              originalFile: batchResult.originalFile
            };
            setValidationData(augmentedData);
            setSignerInfo(batchResult.additionalInfos?.signer || []);
            
            // Set batch data for batch view
            setBatchResults(batchData.results as BatchResult[]);
            setBatchSummary(batchData.batch.summary);
            setBatchSettings(batchData.batch.settings);
            const currentResultIndex = batchData.results.findIndex(r => r.id === validationId);
            if (currentResultIndex > -1) {
              setBatchResultIndex(currentResultIndex);
            }
          }
          checkForBatch = batchData.results.length > 1;
        }
      } else {
        // Single validation case
        const storedValidationData = storedData as StoredValidationData;
        const augmentedData: AugmentedValidationData = {
          ...storedValidationData,
          filename: storedValidationData.originalFile || storedValidationData.filename || '',
          size: storedValidationData.size || 0,
          validationTimestamp: storedValidationData.validationTimestamp || new Date().toISOString(),
          settings: storedValidationData.settings,
          originalFile: storedValidationData.originalFile
        };
        setValidationData(augmentedData);
        setSignerInfo(storedValidationData.additionalInfos?.signer || []);
      }

      setIsBatchValidation(checkForBatch);
    } catch (err) {
      console.error('Error loading validation:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [validationId, t, searchParams]);

  // Modify mapToDisplayData to include settings from the response
  const mapToDisplayData = (data: AugmentedValidationData): ExtendedValidationDisplayData => {
    // Use settings from the response if available
    const displaySettings = data.settings || {};
    
    // Check if requirements are not met based on settings
    const isRequirementsNotMet = !data.valid && 
      data.validSignatures === data.signatures && 
      data.signatures > 0 &&
      (
        (displaySettings.quality && data.quality !== displaySettings.quality) ||
        (displaySettings.legislation && data.legislation !== displaySettings.legislation) ||
        (displaySettings.longTermValidation && !data.longTermValidation) ||
        (displaySettings.rejectVisualDifferences && data.visualDifferences) ||
        (displaySettings.rejectUndefinedChanges && data.undefinedChanges)
      );
    
    // Keep the original valid value and just add requirementsNotMet flag
    const isValid = data.valid;
    
    console.log('Mapping validation status:', {
      apiValid: data.valid,
      calculatedStatus: isRequirementsNotMet ? 'requirementsNotMet' : (isValid ? 'valid' : 'invalid'),
      isValid,
      isRequirementsNotMet,
      settings: displaySettings,
      validation: {
        quality: data.quality,
        legislation: data.legislation,
        longTermValidation: data.longTermValidation,
        visualDifferences: data.visualDifferences,
        undefinedChanges: data.undefinedChanges
      }
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
      {/* Success Dialog for completed onboarding flow */}
      <SuccessDialog />
      
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
      
      {!isLoading && validationData && (
        <Box sx={{ mb: 3 }}>
          {isBatchValidation && batchSummary && batchResults.length > 0 ? (
            <BatchValidationResults
              results={batchResults}
              batchInfo={{
                summary: batchSummary,
                settings: batchSettings
              }}
              resultIndex={batchResultIndex}
            />
          ) : (
            <>
              <ValidationResults 
                validation={mapToDisplayData(validationData)}
                signerInfo={signerInfo}
                isLoadingSigners={false}
              />

            </>
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