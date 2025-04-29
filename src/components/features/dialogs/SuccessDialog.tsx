import { useState, useEffect } from 'react'
import { Box, Typography, Button, DialogContent, DialogActions } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import confettiLib from 'canvas-confetti'
import '@/styles/success-dialog.css'
import dynamic from 'next/dynamic'

// Dynamically import Dialog with SSR disabled to avoid hydration issues
const Dialog = dynamic(
  () => import('@mui/material/Dialog'),
  { ssr: false }
);

interface SuccessDialogProps {
  open?: boolean;
  onClose?: () => void;
}

export default function SuccessDialog({ open = false, onClose }: SuccessDialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  
  // Check localStorage for showSuccessAfterValidation flag with a delay
  useEffect(() => {
    // Initial check
    const timer = setTimeout(() => {
      checkForSuccessFlag();
    }, 1500); // 1.5 second delay before showing the dialog
    
    return () => clearTimeout(timer);
  }, []);
  
  const checkForSuccessFlag = () => {
    const shouldShowSuccess = localStorage.getItem('showSuccessAfterValidation') === 'true';
    
    if (shouldShowSuccess) {
      setIsOpen(true);
      // Clean up the flag so it doesn't show on refresh
      localStorage.removeItem('showSuccessAfterValidation');
      
      // Trigger confetti effect
      triggerConfetti();
    }
  };
  
  const triggerConfetti = () => {
    // Check if window is available (for SSR)
    if (typeof window !== 'undefined' && confettiLib) {
      const defaults = { 
        startVelocity: 25, 
        spread: 200,  // Less spread
        ticks: 40,    // Fewer ticks
        zIndex: 9999 
      };
      
      // Just two bursts instead of continuous
      confettiLib({
        ...defaults,
        particleCount: 30, // Fewer particles
        origin: { x: 0.2, y: 0.1 }
      });
      
      confettiLib({
        ...defaults,
        particleCount: 30, // Fewer particles
        origin: { x: 0.8, y: 0.1 }
      });
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  
  const viewReport = () => {
    handleClose();
    // Stay on the current page
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "success-dialog-paper",
        sx: {
          borderRadius: 3,
          p: 0,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <div className="success-dialog-header">
        <div className="trophy-icon-container">
          <EmojiEventsIcon className="trophy-icon" />
        </div>
        <Typography variant="h4" className="success-title" component="div">
          Validation Complete
        </Typography>
      </div>
      
      <DialogContent className="success-dialog-content">
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body1" paragraph className="success-message">
            You have successfully completed the document signing and validation workflow.
          </Typography>
          <Typography variant="body1" className="success-subtitle">
            Your document has gone through the complete Skribble process:
          </Typography>
          <Box component="ul" className="success-steps">
            <li>Document signing request created</li>
            <li>Document electronically signed</li>
            <li>Digital signature validation completed</li>
          </Box>
          
          <Box className="success-banner">
            <CheckCircleIcon className="check-icon" />
            <Typography variant="body2" component="div">
              Workflow complete - You can now view the validation report
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions className="success-dialog-actions">
        <Button 
          onClick={viewReport} 
          variant="contained" 
          color="primary"
          size="large"
          className="view-report-button"
        >
          View Validation Report
        </Button>
      </DialogActions>
    </Dialog>
  );
} 