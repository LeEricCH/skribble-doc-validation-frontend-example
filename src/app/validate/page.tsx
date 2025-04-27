'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, AlertTitle, Box, Link as MuiLink, Tabs, Tab, Paper, Typography, Divider } from '@mui/material'
import { FileCheck, HelpCircle, Info, AlertTriangle, RefreshCw, History, Settings } from 'lucide-react'
import MainContent from '@/components/layout/MainContent'
import DocumentUploader from '@/components/features/validator/DocumentUploader'
import ValidationResults from '@/components/features/validator/ValidationResults'
import type { ValidationResponse, SignerInfo, ValidationOptions } from '../../types/validation'
import type { ValidationDisplayData } from '@/components/features/validator/ValidationResults'
import validationHistory from '@/utils/validationHistory'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

// Define an interface for our augmented validation data that includes settings
interface AugmentedValidationData extends ValidationResponse {
  filename: string;
  size: number;
  validationTimestamp: string;
  settings?: ValidationOptions;
}

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`validation-tabpanel-${index}`}
      aria-labelledby={`validation-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function for tab accessibility props
function a11yProps(index: number) {
  return {
    id: `validation-tab-${index}`,
    'aria-controls': `validation-tabpanel-${index}`,
  };
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
  const [activeTab, setActiveTab] = useState(0);
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

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch signer information when validation is complete and we have an ID
  useEffect(() => {
    async function fetchSignerInfo() {
      if (!validationComplete || !validationData?.id) {
        return;
      }

      setIsLoadingSigners(true);
      try {
        const response = await fetch(`/api/signers/${validationData.id}`);
        const signers = await response.json();
        
        if (!response.ok) {
          console.error('Failed to fetch signer information:', signers);
          // Don't show an error - just don't display signer info
          setSignerInfo(null);
        } else {
          console.log('Signer information retrieved:', signers);
          setSignerInfo(signers);
        }
      } catch (err) {
        console.error('Error fetching signer information:', err);
        setSignerInfo(null);
      } finally {
        setIsLoadingSigners(false);
      }
    }

    fetchSignerInfo();
  }, [validationComplete, validationData]);

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsValidating(true)
    setError(null) // Clear previous errors
    setValidationComplete(false) // Reset completion state
    setValidationData(null) // Clear previous data
    setSignerInfo(null) // Clear previous signer data
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Add validation settings to the request if available
    if (validationSettings) {
      formData.append('settings', JSON.stringify(validationSettings));
    }

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors returned from our endpoint
        const errorMsg = result.message || `Validation failed with status ${response.status}`;
        console.error('Validation API Error:', result);
        setError(errorMsg + (result.details ? `: ${JSON.stringify(result.details)}` : ''));
        setValidationData(null); // Ensure no partial data is shown
      } else {
        // Successful validation
        console.log('Validation successful:', result);
        // Construct the data structure expected by ValidationResults
        const augmentedData: AugmentedValidationData = {
          ...result,
          filename: selectedFile.name,
          size: selectedFile.size,
          validationTimestamp: new Date().toISOString()
        };
        setValidationData(augmentedData);
        setValidationComplete(true);
      }

    } catch (err: unknown) {
      console.error('Frontend validation error:', err);
      let errorMessage = 'An unexpected error occurred while validating the document.';
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
      setValidationData(null);
    } finally {
      setIsValidating(false)
    }
  }

  const resetValidation = () => {
    setValidationComplete(false)
    setValidationData(null)
    setSelectedFile(null)
    setError(null)
    setSignerInfo(null)
    setActiveTab(0)
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
    >
      <div className="content-container">
        {/* Error Display */}
        {error && (
          <Box sx={{ width: '100%', maxWidth: '900px', mb: 3 }}>
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
        
        {!validationComplete ? (
          <Paper 
            elevation={3} 
            sx={{ 
              width: '100%', 
              maxWidth: 900, 
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="validation options"
                sx={{ 
                  '& .MuiTab-root': { 
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    minHeight: '56px'
                  } 
                }}
              >
                <Tab label={t('uploadTab')} {...a11yProps(0)} />
                <Tab label={t('aboutTab')} {...a11yProps(1)} />
              </Tabs>
            </Box>
            
            <TabPanel value={activeTab} index={0}>
              <DocumentUploader 
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                isValidating={isValidating} 
              />
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mt: 4,
                  mb: 2,
                  width: '100%',
                  maxWidth: '500px',
                  mx: 'auto'
                }}
              >
                {selectedFile && !isValidating && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleUpload}
                    startIcon={<FileCheck />}
                    disabled={isValidating}
                    sx={{
                      bgcolor: '#e74c3c',
                      '&:hover': {
                        bgcolor: '#c0392b',
                      },
                      py: 1.8,
                      px: 5,
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '1.1rem',
                      width: '100%',
                      boxShadow: '0 4px 12px rgba(231, 76, 60, 0.25)',
                      textTransform: 'none'
                    }}
                  >
                    {t('validateButton')}
                  </Button>
                )}
                <Button
                  component={Link}
                  href="/settings/validation"
                  variant="outlined"
                  startIcon={<Settings size={18} />}
                  sx={{
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    color: 'rgba(0, 0, 0, 0.87)',
                    '&:hover': { 
                      borderColor: 'rgba(0, 0, 0, 0.42)', 
                      bgcolor: 'rgba(0, 0, 0, 0.04)' 
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    py: 1.5,
                    px: 4,
                    fontSize: '0.95rem',
                    width: { xs: '100%', md: 'auto' }
                  }}
                >
                  {t('validationSettings')}
                </Button>
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t('aboutTitle')}
                </Typography>
                <Typography paragraph>
                  {t('aboutDescription')}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={18} />
                  {t('whatWeValidate')}
                </Typography>
                <ul className="validation-features">
                  <li>{t('validationFeatures.signatureAuthenticity')}</li>
                  <li>{t('validationFeatures.certificateValidity')}</li>
                  <li>{t('validationFeatures.timestampVerification')}</li>
                  <li>{t('validationFeatures.longTermValidation')}</li>
                  <li>{t('validationFeatures.compliance')}</li>
                </ul>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpCircle size={18} />
                  {t('supportedDocumentTypes')}
                </Typography>
                <ul className="validation-features">
                  <li>{t('documentTypes.pdfSignatures')}</li>
                  <li>{t('documentTypes.padesSignatures')}</li>
                </ul>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={18} />
                  {t('apiInfo')}
                </Typography>
                <Typography paragraph>
                  {t('apiDescription')}
                </Typography>
                <Button
                  variant="outlined"
                  component={MuiLink}
                  href={t('skribbleLinkUrl')}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<Info size={16} />}
                  sx={{ mb: 2, textTransform: 'none' }}
                >
                  {t('skribbleApiButton')}
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        ) : (
          <Paper 
            elevation={3} 
            sx={{ 
              width: '100%', 
              maxWidth: 900, 
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <div className="results-container">
              <ValidationResults 
                data={validationData ? mapToDisplayData(validationData) : null}
                signerInfo={signerInfo}
                isLoadingSigners={isLoadingSigners}
              />
            </div>
          </Paper>
        )}
        
        {/* "Validate another document" button at the bottom when validation is complete */}
        {validationComplete && (
          <Box sx={{ 
            width: '100%', 
            maxWidth: '900px', 
            mt: 3,
            mb: 3,
            display: 'flex',
            justifyContent: 'center',
            gap: 2
          }}>
            <Button
              variant="outlined"
              onClick={resetValidation}
              startIcon={<RefreshCw size={16} />}
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'rgba(0, 0, 0, 0.87)',
                '&:hover': { borderColor: 'rgba(0, 0, 0, 0.42)', bgcolor: 'rgba(0, 0, 0, 0.04)' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                py: 1.5,
                px: 4,
                fontSize: '1rem'
              }}
            >
              {t('validateAnother')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/history')}
              startIcon={<History size={16} />}
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'rgba(0, 0, 0, 0.87)',
                '&:hover': { borderColor: 'rgba(0, 0, 0, 0.42)', bgcolor: 'rgba(0, 0, 0, 0.04)' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                py: 1.5,
                px: 4,
                fontSize: '1rem'
              }}
            >
              {t('viewHistory')}
            </Button>
          </Box>
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
        
        .validate-button-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        
        .results-container {
          width: 100%;
        }
        
        .validation-features {
          padding-left: 20px;
          margin: 10px 0;
        }
        
        .validation-features li {
          margin-bottom: 8px;
          position: relative;
        }
        
        .validation-features li::before {
          content: "✓";
          color: #27ae60;
          font-weight: bold;
          position: absolute;
          left: -20px;
        }
      `}</style>
    </MainContent>
  )
} 