"use client";

import type { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Button, Paper } from '@mui/material';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
    id?: string;
  }>;
  backButton?: {
    label: string;
    href: string;
    onClick?: () => void;
    icon?: ReactNode;
  };
  actionButton?: {
    label: string;
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    variant?: 'text' | 'outlined' | 'contained';
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
  isLoading?: boolean;
  sticky?: boolean;
}

export default function PageHeader({
  title,
  breadcrumbs,
  backButton,
  actionButton,
  isLoading = false,
  sticky = true
}: PageHeaderProps) {
  const loadingTitle = isLoading ? 'Loading...' : title;

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 2, 
        bgcolor: 'background.paper',
        position: sticky ? 'sticky' : 'static',
        top: 0,
        zIndex: 1100,
        boxShadow: sticky ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const itemKey = item.id || `breadcrumb-${item.label}-${index}`;
            
            if (isLast) {
              return (
                <Typography key={itemKey} color="text.primary" fontWeight="medium">
                  {isLoading && item.label === title ? 'Loading...' : item.label}
                </Typography>
              );
            }
            
            return item.href ? (
              <Link key={itemKey} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography color="text.secondary">{item.label}</Typography>
              </Link>
            ) : (
              <Typography key={itemKey} color="text.secondary">{item.label}</Typography>
            );
          })}
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {backButton && (
              <Button
                startIcon={backButton.icon}
                onClick={backButton.onClick}
                href={backButton.href}
                component={Link}
                variant="outlined"
                size="small"
              >
                {backButton.label}
              </Button>
            )}
            <Typography variant="h5" component="h1" fontWeight="bold">
              {loadingTitle}
            </Typography>
          </Box>

          {actionButton && (
            <Button
              color={actionButton.color || 'primary'}
              variant={actionButton.variant || 'contained'}
              startIcon={actionButton.icon}
              onClick={actionButton.onClick}
              disabled={actionButton.disabled || isLoading}
              href={actionButton.href}
              component={actionButton.href ? Link : 'button'}
              size="medium"
            >
              {actionButton.label}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
} 