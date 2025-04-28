'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Link as MuiLink, Paper, Typography } from '@mui/material'
import { FileCheck, AlertTriangle, RefreshCw, History } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationResults from '@/components/features/validator/ValidationResults'
import ValidationSettingsPanel from '@/components/features/validator/ValidationSettingsPanel'
import type { ValidationResponse, SignerInfo, ValidationOptions } from '../../types/validation'
import type { ValidationDisplayData } from '@/components/features/validator/ValidationResults'
import validationHistory from '@/utils/validationHistory'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

// Define an interface for our augmented validation data that includes settings
interface AugmentedValidationData extends ValidationResponse {
  filename: string;
  size: number;
  validationTimestamp: string;
  settings?: ValidationOptions;
}

export default function ValidatePage() {
  const t = useTranslations('Validator')
  const [isValidating, setIsValidating] = useState(false)
  const [validationComplete, setValidationComplete] = useState(false)
  const [validationData, setValidationData] = useState<AugmentedValidationData | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
      if (!validationComplete || !validationData?.id) {
        return;
      }
      
      setIsLoadingSigners(true);
      
      try {
        const response = await fetch(`/api/signers/${validationData.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch signer info: ${response.status}`);
        }
        
        const data = await response.json();
        setSignerInfo(data);
      } catch (err) {
        console.error('Error fetching signer info:', err);
      } finally {
        setIsLoadingSigners(false);
      }
    }
    
    fetchSignerInfo();
  }, [validationComplete, validationData]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsValidating(true);
    setError(null);
    setValidationComplete(false);
    setValidationData(null);
    setSignerInfo(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      
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
      
      const data: ValidationResponse = await response.json();
      
      // Add additional metadata to the validation response
      const augmentedData: AugmentedValidationData = {
        ...data,
        filename: selectedFile.name,
        size: selectedFile.size,
        validationTimestamp: new Date().toISOString(),
        settings: validationSettings || undefined
      };
      
      // Save to validation history
      validationHistory.addToHistory({
        id: data.id,
        filename: selectedFile.name,
        timestamp: new Date().toISOString(),
        valid: data.valid,
        totalSignatures: data.signatures,
        validSignatures: data.validSignatures
      });
      
      // Update state
      setValidationData(augmentedData);
      setValidationComplete(true);
      
      // If we have signer details, fetch them
      if (data.id) {
        // We'll use the useEffect to fetch signer info
      }
      
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
    setSelectedFile(null)
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
      validationHistory.addToHistory({
        id: validationData.id,
        filename: validationData.filename,
        timestamp: validationData.validationTimestamp,
        valid: validationData.valid,
        totalSignatures: validationData.signatures,
        validSignatures: validationData.validSignatures
      });
    }
  }, [validationComplete, validationData]);

  return (
    <MainContent
      title={t('title')}
      subtitle={t('subtitle')}
      fullWidth={validationComplete}
    >
      <div className="content-container">
        {/* Error Display */}
        {error && (
          <Box sx={{ width: '100%', maxWidth: '1400px', mb: 3 }}>
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              icon={<AlertTriangle color="#f44336" />}
              sx={{ 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                borderRadius: '10px',
                '.MuiAlert-message': { padding: '8px 0' }
              }}
            >
              <AlertTitle sx={{ fontWeight: 500 }}>{t('errorTitle')}</AlertTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {error} 
                <Typography component="span" sx={{ ml: 1 }}>
                  {t('errorHelp')}
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                {t('contactSupport')} <MuiLink href="/help">{t('contactSupportLink')}</MuiLink>.
              </Box>
            </Alert>
          </Box>
        )}

        {/* Step 3: Show results after validation */}
        {validationComplete ? (
          <Paper 
            elevation={3} 
            sx={{ 
              width: '100%',
              maxWidth: 'none',
              mx: 'auto',
              borderRadius: 3,
              overflow: 'hidden',
              mt: 4,
              mb: 4,
              p: { xs: 1, md: 0 }
            }}
          >
            <div className="results-container">
              <div className="results-content">
                <ValidationResults 
                  data={validationData ? mapToDisplayData(validationData) : null}
                  signerInfo={signerInfo}
                  isLoadingSigners={isLoadingSigners}
                />
              </div>
              
              {/* Action buttons inside the card with no side padding */}
              <div className="action-buttons-container">
                <Button
                  variant="contained"
                  onClick={resetValidation}
                  startIcon={<RefreshCw size={18} />}
                  sx={{
                    bgcolor: '#e74c3c',
                    '&:hover': {
                      bgcolor: '#c0392b',
                    },
                    py: 2,
                    px: 4,
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    boxShadow: 'none',
                    textTransform: 'none',
                    minHeight: '54px',
                    width: '70%',
                    whiteSpace: 'nowrap',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                      zIndex: 1
                    }
                  }}
                >
                  {t('validateAnother')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/history')}
                  startIcon={<History size={18} />}
                  sx={{
                    borderColor: '#e74c3c',
                    color: '#e74c3c',
                    '&:hover': { 
                      borderColor: '#c0392b', 
                      bgcolor: 'rgba(231, 76, 60, 0.04)' 
                    },
                    py: 2,
                    borderRadius: 0,
                    borderLeft: 'none',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    minHeight: '54px',
                    width: '30%',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('viewHistory')}
                </Button>
              </div>
            </div>
          </Paper>
        
        /* Step 1: Only show uploader until a file is selected */
        ) : !selectedFile ? (
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: 700,
              borderRadius: 3,
              overflow: 'hidden',
              mt: 6,
              mb: 6,
              p: { xs: 2, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 500
            }}
          >
            <DocumentUploader 
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              isValidating={isValidating} 
            />
          </Paper>
        
        /* Step 2: Show settings and validate button after file is selected */
        ) : (
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: 1200,
              borderRadius: 3,
              overflow: 'hidden',
              mt: 4,
              mb: 4,
              p: { xs: 5, md: 10 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              minHeight: 700,
              position: 'relative',
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
              <DocumentUploader 
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                isValidating={isValidating} 
              />
              {!isValidating && (
                <Box sx={{ width: '100%', mt: 2, mb: 0 }}>
                  <ValidationSettingsPanel
                    settings={validationSettings}
                    onSettingsChange={(newSettings: ValidationOptions) => {
                      setValidationSettings(newSettings);
                      localStorage.setItem('validationSettings', JSON.stringify(newSettings));
                    }}
                  />
                </Box>
              )}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={!selectedFile || isValidating}
              startIcon={<FileCheck />}
              sx={{
                bgcolor: '#e74c3c',
                '&:hover': {
                  bgcolor: '#c0392b',
                },
                py: 2.5,
                px: 5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '1.25rem',
                width: '100%',
                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.25)',
                textTransform: 'none',
                position: 'absolute',
                left: 0,
                bottom: 0,
                minHeight: '64px',
                maxWidth: '100%',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                  zIndex: 1
                }
              }}
            >
              {isValidating ? t('validating') : t('validate')}
            </Button>
          </Paper>
        )}
      </div>

      <style jsx>{`
        .content-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }
        
        .validation-features {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .validation-features li {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        
        .results-container {
          width: 100%;
          padding: 0;
        }
        
        .results-content {
          padding: 1.5rem;
        }
        
        .action-buttons-container {
          margin-top: 1rem;
          width: 100%;
          display: flex;
          flex-direction: row;
          padding: 0;
          border-top: 1px solid #eaeaea;
        }
      `}</style>
    </MainContent>
  )
} 