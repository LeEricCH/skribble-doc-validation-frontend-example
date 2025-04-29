'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  Button, 
  Typography, 
  TextField, 
  Box,
  Step,
  StepLabel,
  Stepper,
  CircularProgress,
  Paper,
  Alert,
  Container,
  Fade,
  Divider
} from '@mui/material';
import signingStorage from '@/utils/signingStorage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreateIcon from '@mui/icons-material/Create';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter, useSearchParams } from 'next/navigation';
import MainContent from '@/components/layout/MainContent';
import { Turnstile } from 'next-turnstile';
import { SAMPLE_PDF_BASE64 } from '@/lib/base64';
import { useTranslations } from 'next-intl';

// Steps for the onboarding process
const steps = [
  {
    label: 'steps.welcome',
    description: 'steps.welcomeDescription',
    icon: <EmojiPeopleIcon />
  },
  {
    label: 'steps.createRequest',
    description: 'steps.createRequestDescription',
    icon: <CreateIcon />
  },
  {
    label: 'steps.signDocument',
    description: 'steps.signDocumentDescription',
    icon: <DescriptionIcon />
  },
  {
    label: 'steps.validateDocument',
    description: 'steps.validateDocumentDescription',
    icon: <VerifiedIcon />
  },
  {
    label: 'steps.complete',
    description: 'steps.completeDescription',
    icon: <CheckCircleIcon />
  }
];

// Wrap the component that uses useSearchParams in a Suspense boundary
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoader />}>
      <OnboardingContent />
    </Suspense>
  );
}

// Loading component for the Suspense boundary
function OnboardingLoader() {
  return (
    <MainContent
      title="Skribble API Demo"
      description="Experience Skribble's E-Signing and Validation APIs"
    >
      <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    </MainContent>
  );
}

// Main component with all the onboarding functionality
function OnboardingContent() {
  const t = useTranslations('Onboarding');
  const [activeStep, setActiveStep] = useState(-1); // Start with welcome screen
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for an active signature request when the component mounts
  useEffect(() => {
    // Check if we're returning from signing via URL parameters
    const signingSuccess = searchParams.get('signingSuccess');
    const requestId = searchParams.get('id');
    
    if (signingSuccess && requestId) {
      setIsLoading(true);
      
      // Call the API to check signature status
      const fetchStatus = async () => {
        try {
          const response = await fetch(`/api/signing/request-status/${requestId}`);
          
          if (response.ok) {
            // Ensure we're using the latest status
            localStorage.setItem('currentSigningRequestId', requestId);
            // Remove query parameters from URL without refreshing the page
            window.history.replaceState({}, '', window.location.pathname);
            
            // Get the status data and handle it
            const data = await response.json();
            signingStorage.saveSignatureData(requestId, data);
            
            // Process the status data
            const isSignedOrCompleted = 
              (data.status === 'SIGNED' || data.status === 'COMPLETED')

            
            if (isSignedOrCompleted) {
              setActiveStep(3); // Move to the validation step
              
              // Get document content if available
              if (data.documents && data.documents.length > 0) {
                const docId = data.documents[0].id;
                try {
                  const documentResponse = await fetch(`/api/signing/document/${docId}?format=json`);
                  
                  if (documentResponse.ok) {
                    const documentData = await documentResponse.json();
                    signingStorage.saveDocumentContent(requestId, documentData.content);
                  }
                } catch (docError) {
                  console.error('Error fetching document content:', docError);
                }
              }
            } else if (data.signatures && data.signatures.length > 0) {
              // Document not yet signed, but we have a signing URL
              setSigningUrl(data.signatures[0].signing_url);
              setActiveStep(2); // Stay on signing step
            }
          } else {
            console.error('Error response:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
          }
        } catch (error) {
          console.error('Error checking signature status:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchStatus();
    } else {
      // Check for an active signature request
      const activeRequestId = signingStorage.getActiveRequest();
      if (activeRequestId) {
        checkSignatureStatus(activeRequestId);
      }
    }
  }, [searchParams]);

  // Check the status of a signature request
  const checkSignatureStatus = async (requestId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/signing/request-status/${requestId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check signature status');
      }
      
      const data = await response.json();
      signingStorage.saveSignatureData(requestId, data);
      
      // Check if the document is signed - handle both status fields
      const isSignedOrCompleted = 
        (data.status === 'SIGNED' || data.status === 'COMPLETED') ||
        (data.status_overall === 'SIGNED' || data.status_overall === 'COMPLETED');
      
      
      if (isSignedOrCompleted) {
        setActiveStep(3); // Move to the validation step
        
        // Get the document content if available
        if (data.documents && data.documents.length > 0) {
          const docId = data.documents[0].id;
          try {
            const documentResponse = await fetch(`/api/signing/document/${docId}?format=json`);
            
            if (documentResponse.ok) {
              const documentData = await documentResponse.json();
              signingStorage.saveDocumentContent(requestId, documentData.content);
            }
          } catch (docError) {
            console.error('Error fetching document content:', docError);
          }
        }
      } else if (data.signatures && data.signatures.length > 0) {
        // Document not yet signed, but we have a signing URL
        setSigningUrl(data.signatures[0].signing_url);
        setActiveStep(2); // Stay on signing step
      }
    } catch (error) {
      console.error('Error checking signature status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new signature request
  const createSignatureRequest = async () => {
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get browser language for signature request
      const language = navigator.language.split('-')[0] || 'en';
      
      // Get the stored Turnstile token
      const turnstileToken = localStorage.getItem('turnstileToken') || '';
      console.log('Retrieved token from localStorage, token length:', turnstileToken.length);
      
      // Clear the token immediately after use to prevent reuse
      localStorage.removeItem('turnstileToken');
      
      // Create signature request
      const response = await fetch('/api/signing/create-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: SAMPLE_PDF_BASE64,
          email,
          mobileNumber: '',
          language,
          turnstileToken
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create signature request');
      }
      
      const data = await response.json();
      
      // Store the request and set it as active
      signingStorage.saveSignatureData(data.id, data);
      signingStorage.setActiveRequest(data.id);
      
      // Store the original PDF content for validation later
      // We can use the sample PDF directly for demo purposes
      signingStorage.saveDocumentContent(data.id, SAMPLE_PDF_BASE64);
      console.log(`Saved original document content for request ID: ${data.id}`);
      
      // Update state
      setActiveStep(2);
      
      // Get signing URL
      if (data.signatures && data.signatures.length > 0) {
        // Add exit URL to signing URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const exitUrl = `${baseUrl}/onboarding?signingSuccess=true&id=${data.id}`;
        const signingUrlWithExit = `${data.signatures[0].signing_url}?exitURL=${encodeURIComponent(exitUrl)}&redirectTimeout=5&hidedownload=true`;
        
        setSigningUrl(signingUrlWithExit);
      }
    } catch (error) {
      console.error('Error creating signature request:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start the onboarding process from welcome page
  const startOnboarding = () => {
    // Instead of immediately setting activeStep to 1, we show the Turnstile first
    setActiveStep(0); // 0 will be our Turnstile verification step
  };
  
  // Proceed to create request step after Turnstile verification
  const proceedAfterVerification = () => {
    setActiveStep(1);
  };
  
  // Redirect to the signing URL
  const goToSigning = () => {
    if (signingUrl) {
      window.location.href = signingUrl;
    }
  };
  
  // Proceed to the validation step
  const goToValidation = () => {
    const activeRequestId = signingStorage.getActiveRequest();
    
    if (activeRequestId) {
      // Set a flag to indicate we're coming from onboarding with a document to validate
      localStorage.setItem('validateSignedDocument', 'true');
      localStorage.setItem('onboardingCompleted', 'true');
      
      // Set a cookie for the middleware to check
      document.cookie = "onboardingCompleted=true; path=/; max-age=31536000"; // 1 year expiration
      
      // Redirect to the validator page (home)
      router.push('/');
    } else {
      // If no request ID is found, just complete the onboarding
      setActiveStep(4);
      localStorage.setItem('onboardingCompleted', 'true');
      document.cookie = "onboardingCompleted=true; path=/; max-age=31536000";
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  };
  
  // Render the welcome screen
  const renderWelcomeScreen = (startOnboarding: () => void) => {
    return (
      <Fade in={true} timeout={800}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Header */}
          <Box sx={{ mb: 5, mt: 2 }}>
            <EmojiPeopleIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" color="primary.main" gutterBottom fontWeight="bold">
              {t('welcomeTitle')}
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('welcomeSubtitle')}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          {/* Feature cards */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                width: { xs: '100%', sm: '30%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  mb: 2
                }}>
                  <DescriptionIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {t('features.electronicSigning')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('features.electronicSigningDescription')}
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ 
                p: 3, 
                width: { xs: '100%', sm: '30%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  mb: 2
                }}>
                  <SecurityIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {t('features.secureProcess')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('features.secureProcessDescription')}
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ 
                p: 3, 
                width: { xs: '100%', sm: '30%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  mb: 2
                }}>
                  <VerifiedIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {t('features.validation')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('features.validationDescription')}
                </Typography>
              </Paper>
            </Box>
          </Box>
          
          <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            {t('welcomeText')}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={startOnboarding}
            sx={{ px: 4, py: 1, fontSize: '1rem' }}
          >
            {t('beginButton')}
          </Button>
        </Box>
      </Fade>
    );
  };
  
  // Render the correct content based on the current step
  const renderStepContent = () => {
    if (activeStep === -1) {
      return renderWelcomeScreen(startOnboarding);
    }
    
    // Add a new case for Turnstile verification
    if (activeStep === 0) {
      return (
        <Fade in={true} timeout={500}>
          <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h5" color="primary" gutterBottom>
              {t('securityVerification')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('securityVerificationText')}
            </Typography>
            
            <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onVerify={async (token) => {
                  try {
                    // Don't verify the token here - just store it and let the backend verify it
                    localStorage.setItem('turnstileToken', token);
                    setTurnstileVerified(true);
                    setError(null);
                  } catch (err) {
                    console.error('Error handling Turnstile token:', err);
                    setError("An error occurred. Please try again.");
                    setTurnstileVerified(false);
                  }
                }}
                onError={() => {
                  setError("Verification failed. Please try again.");
                  setTurnstileVerified(false);
                }}
                onExpire={() => {
                  setError("Verification expired. Please try again.");
                  setTurnstileVerified(false);
                }}
                refreshExpired="auto"
              />
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
          </Box>
        </Fade>
      );
    }
    
    switch (activeStep) {
      case 1:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CreateIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" color="primary">
                  {t('createRequest.title')}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {t('createRequest.description')}
              </Typography>
              
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  {t('createRequest.detailsTitle')}
                </Typography>
                
                <TextField
                  label={t('createRequest.emailLabel')}
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  placeholder={t('createRequest.emailPlaceholder')}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('createRequest.emailDisclaimer')}
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main">
                  {t('createRequest.info')}
                </Typography>
              </Box>
            </Box>
          </Fade>
        );
        
      case 2:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DescriptionIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" color="primary">
                  {t('signDocument.title')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    maxWidth: 500,
                    width: '100%',
                    p: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" gutterBottom textAlign="center">
                    {t('signDocument.readyTitle')}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    {t('signDocument.description')}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {t('signDocument.redirectNote')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <SecurityIcon sx={{ color: 'success.main', fontSize: 40 }} />
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 2, mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body2" color="success.dark" textAlign="center">
                  {t('signDocument.disclaimer')}
                </Typography>
              </Box>
            </Box>
          </Fade>
        );
        
      case 3:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 4, 
                pb: 3, 
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <VerifiedIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" color="primary">
                  {t('documentSigned.title')}
                </Typography>
              </Box>
              
              <Box sx={{ 
                bgcolor: 'success.50', 
                p: 4, 
                borderRadius: 3, 
                mb: 4,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: 'rgba(76, 175, 80, 0.1)'
                  }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 36, mr: 2 }} />
                  <Typography variant="h6" color="success.dark" fontWeight="medium">
                    {t('documentSigned.banner')}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: 3 }}>
                  <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <Typography variant="body1" color="success.dark" paragraph>
                      {t('documentSigned.description')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>{t('documentSigned.nextStep')}</strong>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    minWidth: {xs: '100%', sm: '160px'}, 
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <DescriptionIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">{t('documentSigned.signedAt')}</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date().toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography variant="h6" gutterBottom color="primary.dark">
                  {t('documentSigned.validationProcessTitle')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {t('documentSigned.validationProcessDescription')}
                </Typography>
                
                <Box sx={{ pl: 2, borderLeft: '2px dashed rgba(25, 118, 210, 0.3)' }}>
                  <Typography variant="body2" paragraph sx={{ ml: 1 }}>
                    {t('documentSigned.validationChecks')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ml: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">{t('documentSigned.checks.digitalSignature')}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">{t('documentSigned.checks.certificateValidity')}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">{t('documentSigned.checks.documentIntegrity')}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">{t('documentSigned.checks.timestampVerification')}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            
            </Box>
          </Fade>
        );
        
      case 4:
        return (
          <Fade in={true} timeout={500}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <EmojiEventsIcon color="success" sx={{ fontSize: 80, mb: 3 }} />
              <Typography variant="h4" color="success.main" gutterBottom>
                {t('complete.title')}
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 3 }}>
                {t('complete.subtitle')}
              </Typography>
              
              <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 4, bgcolor: 'background.paper' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {t('complete.description')}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreateIcon color="primary" />
                    <Typography variant="body1">{t('complete.steps.createRequest')}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="body1">{t('complete.steps.signDocument')}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VerifiedIcon color="primary" />
                    <Typography variant="body1">{t('complete.steps.validateDocument')}</Typography>
                  </Box>
                </Box>
              </Paper>
              
              <Typography variant="body1" paragraph>
                {t('complete.nextSteps')}
              </Typography>
            </Box>
          </Fade>
        );
        
      default:
        return null;
    }
  };
  
  // Determine the action button text based on the active step
  const getActionButtonText = () => {
    switch (activeStep) {
      case -1:
        return t('beginButton');
      case 0:
        return turnstileVerified ? t('buttons.continue') : t('buttons.completeVerification');
      case 1:
        return isLoading ? t('buttons.creating') : t('buttons.createRequest');
      case 2:
        return isLoading ? t('buttons.loading') : t('buttons.proceedToSigning');
      case 3:
        return t('buttons.validateDocument');
      case 4:
        return t('buttons.goToValidator');
      default:
        return 'Next';
    }
  };
  
  // Handle the action button click
  const handleActionButtonClick = () => {
    switch (activeStep) {
      case -1:
        startOnboarding();
        break;
      case 0:
        if (turnstileVerified) {
          proceedAfterVerification();
        }
        break;
      case 1:
        createSignatureRequest();
        break;
      case 2:
        goToSigning();
        break;
      case 3:
        goToValidation();
        break;
      case 4:
        router.push('/');
        break;
    }
  };
  
  // Determine if the action button should be disabled
  const isActionButtonDisabled = () => {
    if (isLoading) return true;
    if (activeStep === 0 && !turnstileVerified) return true;
    if (activeStep === 1 && (!email)) return true;
    if (activeStep === 2 && !signingUrl) return true;
    return false;
  };
  
  return (
    <MainContent
      title="Skribble API Demo"
      description="Experience Skribble's E-Signing and Validation APIs"
    >
      <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
        {activeStep >= 0 && (
          <Box sx={{ width: '100%', mb: 4, mt: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={step.label} completed={activeStep > index}>
                  <StepLabel StepIconComponent={() => (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: activeStep >= index ? 'primary.main' : 'action.disabled',
                      color: 'white',
                      boxShadow: activeStep >= index ? 2 : 0
                    }}>
                      {step.icon}
                    </Box>
                  )}>
                    <Typography variant="body2" fontWeight={activeStep === index ? 'bold' : 'normal'}>
                      {t(step.label)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(step.description)}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            renderStepContent()
          )}
        </Paper>
        
        {activeStep > -1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              onClick={handleActionButtonClick}
              variant="contained"
              disabled={isActionButtonDisabled()}
              startIcon={activeStep === 2 ? <CreateIcon /> : undefined}
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1rem',
                borderRadius: 2,
                boxShadow: 3 
              }}
            >
              {getActionButtonText()}
            </Button>
          </Box>
        )}
      </Container>
    </MainContent>
  );
} 