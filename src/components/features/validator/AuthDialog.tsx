import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose }) => {
  const { login } = useAuth();
  const t = useTranslations('AuthDialog');

  const handleLogin = async () => {
    await login();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      aria-labelledby="auth-dialog-title" 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }
      }}
    >
      <Box 
        sx={{ 
          textAlign: 'center',
          pt: 4,
          pb: 2
        }}
      >
        <Typography 
          variant="h4" 
          id="auth-dialog-title"
          component="h2" 
          sx={{ 
            fontWeight: 700,
            color: 'primary.main'
          }}
        >
          {t('loginRequiredTitle')}
        </Typography>
      </Box>

      <DialogContent sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 4,
        pb: 4
      }}>
        <Box sx={{ 
          position: 'relative',
          width: '240px',
          height: '240px',
          my: 3,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)'
          }
        }}>
          <Image 
            src="/images/illustration.webp" 
            alt="Login Illustration" 
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.secondary',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: 1.6,
            mb: 2
          }}
        >
          {t('loginRequiredMessage')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ 
        justifyContent: 'center', 
        gap: 2,
        px: 4,
        pb: 4,
        pt: 2
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            flex: 1,
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          {t('cancelButton')}
        </Button>
        <Button 
          onClick={handleLogin} 
          variant="contained" 
          sx={{ 
            flex: 2,
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          {t('loginButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthDialog; 