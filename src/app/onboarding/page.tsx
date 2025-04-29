'use client';

import { useState, useEffect } from 'react';
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

// Use a sample PDF for demo purposes
const SAMPLE_PDF_BASE64 = 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooU2tyaWJibGUgRGVtbyBEb2N1bWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G';

// Steps for the onboarding process
const steps = [
  {
    label: 'Welcome',
    description: 'Introduction to Skribble API demo',
    icon: <EmojiPeopleIcon />
  },
  {
    label: 'Create Request',
    description: 'Enter your details to create a signature request',
    icon: <CreateIcon />
  },
  {
    label: 'Sign Document',
    description: 'Sign the document electronically using AES',
    icon: <DescriptionIcon />
  },
  {
    label: 'Validate Document',
    description: 'Verify the signed document',
    icon: <VerifiedIcon />
  },
  {
    label: 'Complete',
    description: 'Demo finished successfully',
    icon: <CheckCircleIcon />
  }
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(-1); // Start with welcome screen
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    try {
      setIsLoading(true);
      setError(null);
      
      // Get browser language for signature request
      const language = navigator.language.split('-')[0] || 'en';
      
      // Create signature request
      const response = await fetch('/api/signing/create-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: SAMPLE_PDF_BASE64,
          email,
          language
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
              Welcome to Skribble API Demo
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 3 }}>
              Experience document signing and validation with Skribble
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
                  Electronic Signing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign documents with Advanced Electronic Signatures (AES)
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
                  Secure Process
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliant electronic signing workflow
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
                  Validation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verify document authenticity and integrity
                </Typography>
              </Paper>
            </Box>
          </Box>
          
          <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            This demo showcases Skribble&apos;s Signing and Validation APIs.
            You&apos;ll create a signature request, sign a document using AES, and validate it to verify authenticity.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={startOnboarding}
            sx={{ px: 4, py: 1, fontSize: '1rem' }}
          >
            Begin Demo
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
    
    switch (activeStep) {
      case 1:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CreateIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" color="primary">
                  Create Signature Request
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                To get started, we need your email address to create a digital signature request.
                We&apos;ll generate a sample document for you to sign using Skribble&apos;s secure platform.
              </Typography>
              
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Enter your details below:
                </Typography>
                
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  placeholder="you@example.com"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Your email is only used for this demo and won&apos;t be stored permanently.
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main">
                  Once you submit, we&apos;ll create a signature request and prepare a document for you to sign.
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
                  Sign Your Document
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
                    Ready for Secure Signing
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    You will now be redirected to Skribble&apos;s secure signing platform to sign the document using an Advanced Electronic Signature (AES).
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    After signing, you&apos;ll be automatically redirected back to this application to validate your signed document.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <SecurityIcon sx={{ color: 'success.main', fontSize: 40 }} />
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 2, mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body2" color="success.dark" textAlign="center">
                  The signature will be legally valid but the document is just for demo purposes.
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
                  Document Signed Successfully
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
                    Your document has been signed!
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: 3 }}>
                  <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <Typography variant="body1" color="success.dark" paragraph>
                      The document has been signed with an Advanced Electronic Signature (AES).
                      This signature is legally valid in compliance with eIDAS regulations.
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Next step:</strong> Validate your document to ensure its authenticity
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
                    <Typography variant="caption" color="text.secondary">Document signed at</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date().toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography variant="h6" gutterBottom color="primary.dark">
                  Document Validation Process
                </Typography>
                
                <Typography variant="body1" paragraph>
                  In the next step, we&apos;ll validate your signed document to verify its authenticity and integrity using Skribble&apos;s Validation API.
                </Typography>
                
                <Box sx={{ pl: 2, borderLeft: '2px dashed rgba(25, 118, 210, 0.3)' }}>
                  <Typography variant="body2" paragraph sx={{ ml: 1 }}>
                    The validation process checks:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ml: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">Digital signature verification</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">Certificate validity</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">Document integrity since signing</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 18, mr: 1.5 }} />
                      <Typography variant="body2">Timestamp verification</Typography>
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
                Congratulations!
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 3 }}>
                You have successfully completed the Skribble API integration demo.
              </Typography>
              
              <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 4, bgcolor: 'background.paper' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  You&apos;ve experienced the complete flow of Skribble&apos;s E-Signing and Validation APIs:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreateIcon color="primary" />
                    <Typography variant="body1">Creating a signature request</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="body1">Signing a document electronically with AES</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VerifiedIcon color="primary" />
                    <Typography variant="body1">Validating the signed document</Typography>
                  </Box>
                </Box>
              </Paper>
              
              <Typography variant="body1" paragraph>
                You can now proceed to the Document Validator to explore more validation features.
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
        return 'Begin Demo';
      case 1:
        return isLoading ? 'Creating...' : 'Create Signature Request';
      case 2:
        return isLoading ? 'Loading...' : 'Proceed to Signing';
      case 3:
        return 'Validate Document';
      case 4:
        return 'Go to Document Validator';
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
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
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