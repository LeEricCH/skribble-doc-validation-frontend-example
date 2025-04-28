"use client";

import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PreloaderProps {
  children: React.ReactNode;
}

export default function Preloader({ children }: PreloaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to simulate minimum loading time (optional)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);

    // Clean up timeout
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading ? (
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: 'white',
            zIndex: 1000,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : null}
      <Box 
        sx={{ 
          visibility: isLoading ? 'hidden' : 'visible',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        {children}
      </Box>
    </>
  );
} 