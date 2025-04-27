"use client";

import React from 'react';
import { Box, Typography, Button, Paper, Link } from '@mui/material';

interface TrialBannerProps {
  daysLeft?: number;
}

export default function TrialBanner({ daysLeft = 14 }: TrialBannerProps) {
  return (
    <Paper 
      elevation={3}
      sx={{
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box 
        sx={{ 
          width: '6px', 
          height: '100%', 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          backgroundColor: 'primary.main',
        }} 
      />
      <Box sx={{ p: 3, pl: '24px' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Your free trial ends in <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{daysLeft} days</Box>
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Convinced? Great! You don&apos;t have to wait until your trial ends. You can upgrade to the paid plan anytime.
        </Typography>

        <Button 
          variant="contained" 
          fullWidth
          size="medium"
          sx={{ mb: 2, py: 1 }}
        >
          Upgrade now
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Questions?
          </Typography>
          <Link href="/contact" underline="hover" variant="caption">
            Contact us
          </Link>
        </Box>
      </Box>
    </Paper>
  );
} 