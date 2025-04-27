"use client";

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  FormControl,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  type SelectChangeEvent,
  Checkbox,
  ListItemText
} from '@mui/material';
import { 
  ShieldCheck,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ValidationOptions, SignatureQuality, Legislation, AdditionalInfo } from '@/types/validation';

export default function ValidationSettingsPage() {
  const t = useTranslations('ValidationSettings');
  
  // Initialize state from localStorage if available
  const [settings, setSettings] = useState<ValidationOptions>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('validationSettings');
      return savedSettings ? JSON.parse(savedSettings) : {
        quality: 'SES',
        longTermValidation: false,
        legislation: 'WORLD',
        infos: ['validation', 'signer'],
        rejectVisualDifferences: false,
        rejectUndefinedChanges: false
      };
    }
    return {
      quality: 'SES',
      longTermValidation: false,
      legislation: 'WORLD',
      infos: ['validation', 'signer'],
      rejectVisualDifferences: false,
      rejectUndefinedChanges: false
    };
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('validationSettings', JSON.stringify(settings));
  }, [settings]);

  // Handlers for each setting type
  const handleQualityChange = (event: SelectChangeEvent) => {
    setSettings(prev => ({ ...prev, quality: event.target.value as SignatureQuality }));
  };

  const handleLongTermValidationChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, longTermValidation: event.target.checked }));
  };

  const handleLegislationChange = (event: SelectChangeEvent) => {
    setSettings(prev => ({ ...prev, legislation: event.target.value as Legislation }));
  };

  const handleInfosChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSettings(prev => ({ ...prev, infos: typeof value === 'string' ? [value as AdditionalInfo] : value as AdditionalInfo[] }));
  };

  const handleRejectVisualDifferencesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, rejectVisualDifferences: event.target.checked }));
  };

  const handleRejectUndefinedChangesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, rejectUndefinedChanges: event.target.checked }));
  };

  return (
    <Box sx={{ p: 6 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        color: '#34495e', 
        mb: 6 
      }}>
        {t('title')}
      </Typography>

      <Box sx={{ maxWidth: 700 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ShieldCheck size={20} />
          {t('validationRequirements')}
        </Typography>

        <Card sx={{ mb: 4, p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="quality-select-label">{t('quality.label')}</InputLabel>
              <Select
                labelId="quality-select-label"
                id="quality-select"
                value={settings.quality}
                label={t('quality.label')}
                onChange={handleQualityChange}
              >
                <MenuItem value="SES">{t('quality.options.SES')}</MenuItem>
                <MenuItem value="AES">{t('quality.options.AES')}</MenuItem>
                <MenuItem value="QES">{t('quality.options.QES')}</MenuItem>
              </Select>
              <FormHelperText>{t('quality.helper')}</FormHelperText>
            </FormControl>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="legislation-select-label">{t('legislation.label')}</InputLabel>
              <Select
                labelId="legislation-select-label"
                id="legislation-select"
                value={settings.legislation}
                label={t('legislation.label')}
                onChange={handleLegislationChange}
              >
                <MenuItem value="WORLD">{t('legislation.options.WORLD')}</MenuItem>
                <MenuItem value="CH">{t('legislation.options.CH')}</MenuItem>
                <MenuItem value="EU">{t('legislation.options.EU')}</MenuItem>
                <MenuItem value="CH_EU">{t('legislation.options.CH_EU')}</MenuItem>
              </Select>
              <FormHelperText>{t('legislation.helper')}</FormHelperText>
            </FormControl>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.longTermValidation}
                  onChange={handleLongTermValidationChange}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{t('longTermValidation.label')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('longTermValidation.description')}
                  </Typography>
                </Box>
              }
              sx={{ 
                width: '100%', 
                m: 0,
                py: 1
              }}
            />
          </Box>
        </Card>

        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <FileCheck size={20} />
          {t('validationSettings')}
        </Typography>

        <Card sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="infos-select-label">{t('infos.label')}</InputLabel>
              <Select
                labelId="infos-select-label"
                id="infos-select"
                multiple
                value={settings.infos || []}
                label={t('infos.label')}
                onChange={handleInfosChange}
                renderValue={(selected) => selected.join(', ')}
              >
                <MenuItem value="validation">
                  <Checkbox checked={settings.infos?.includes('validation')} />
                  <ListItemText primary={t('infos.options.validation')} />
                </MenuItem>
                <MenuItem value="format">
                  <Checkbox checked={settings.infos?.includes('format')} />
                  <ListItemText primary={t('infos.options.format')} />
                </MenuItem>
                <MenuItem value="signer">
                  <Checkbox checked={settings.infos?.includes('signer')} />
                  <ListItemText primary={t('infos.options.signer')} />
                </MenuItem>
              </Select>
              <FormHelperText>{t('infos.helper')}</FormHelperText>
            </FormControl>
          </Box>
        </Card>

        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AlertTriangle size={20} />
          {t('rejectionSettings')}
        </Typography>

        <Card>
          <Box sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.rejectVisualDifferences}
                  onChange={handleRejectVisualDifferencesChange}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{t('rejectVisualDifferences.label')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('rejectVisualDifferences.description')}
                  </Typography>
                </Box>
              }
              sx={{ 
                width: '100%', 
                m: 0,
                py: 1
              }}
            />
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.rejectUndefinedChanges}
                  onChange={handleRejectUndefinedChangesChange}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{t('rejectUndefinedChanges.label')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('rejectUndefinedChanges.description')}
                  </Typography>
                </Box>
              }
              sx={{ 
                width: '100%', 
                m: 0,
                py: 1
              }}
            />
          </Box>
        </Card>
      </Box>
    </Box>
  );
} 