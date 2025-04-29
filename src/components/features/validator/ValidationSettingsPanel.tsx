import { useState, useEffect } from 'react';
import {
  Typography,
  FormControlLabel,
  Switch,
  Box,
  Paper,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  RadioGroup,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ValidationOptions, SignatureQuality, Legislation } from '@/types/validation';

interface ValidationSettingsPanelProps {
  settings: ValidationOptions | null;
  onSettingsChange: (settings: ValidationOptions) => void;
}

// Quality badge colors
const qualityColors = {
  SES: { bg: '#3BB5FD', color: '#FFF' }, // Light Blue
  AES: { bg: '#1F81E9', color: '#FFF' }, // Blue
  QES: { bg: '#1FB182', color: '#FFF' }  // Green
};

export default function ValidationSettingsPanel({ settings, onSettingsChange }: ValidationSettingsPanelProps) {
  const t = useTranslations('ValidationSettings');
  const theme = useTheme();
  const [localSettings, setLocalSettings] = useState<ValidationOptions>(() => {
    return settings || {
      quality: 'SES',
      longTermValidation: false,
      legislation: 'WORLD',
      infos: ['validation', 'signer'],
      rejectVisualDifferences: false,
      rejectUndefinedChanges: false
    };
  });
  
  const [expanded, setExpanded] = useState<string | false>(false);
  const defaultSettings: ValidationOptions = {
    quality: 'SES',
    longTermValidation: false,
    legislation: 'WORLD',
    infos: ['validation', 'signer'],
    rejectVisualDifferences: false,
    rejectUndefinedChanges: false
  };

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleQualityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...localSettings,
      quality: event.target.value as SignatureQuality
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleLegislationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...localSettings,
      legislation: event.target.value as Legislation
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleLongTermValidationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...localSettings,
      longTermValidation: event.target.checked
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleRejectVisualDifferencesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...localSettings,
      rejectVisualDifferences: event.target.checked
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleRejectUndefinedChangesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...localSettings,
      rejectUndefinedChanges: event.target.checked
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const resetValidationRequirements = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newSettings = {
      ...localSettings,
      quality: defaultSettings.quality,
      longTermValidation: defaultSettings.longTermValidation,
      legislation: defaultSettings.legislation
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const resetRejectionSettings = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newSettings = {
      ...localSettings,
      rejectVisualDifferences: defaultSettings.rejectVisualDifferences,
      rejectUndefinedChanges: defaultSettings.rejectUndefinedChanges
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 4, marginTop: 2 }}>
      {/* Validation Requirements Accordion */}
      <Accordion 
        expanded={expanded === 'validationRequirements'} 
        onChange={handleAccordionChange('validationRequirements')}
        elevation={0}
        sx={{ 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
          borderRadius: '8px', 
          overflow: 'hidden',
          '&:before': { display: 'none' } // Remove the default divider
        }}
      >
        <AccordionSummary
          expandIcon={<ChevronDown />}
          sx={{ 
            borderBottom: expanded === 'validationRequirements' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
            px: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <ShieldCheck size={20} style={{ marginRight: 12, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {t('validationRequirements')}
            </Typography>
            {expanded === 'validationRequirements' && (
              <Tooltip title={t('resetDefaults')}>
                <IconButton 
                  size="small" 
                  onClick={resetValidationRequirements}
                  component="span"
                >
                  <RotateCcw size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2.5 }}>
          {/* Signature Quality */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              {t('quality.label')}
            </Typography>   
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('quality.helper')}
            </Typography>
            
            <RadioGroup
              value={localSettings.quality || 'SES'}
              onChange={handleQualityChange}
              name="signature-quality"
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                {(['SES', 'AES', 'QES'] as SignatureQuality[]).map((quality) => (
                  <Box 
                    key={quality} 
                    sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      height: { xs: 'auto', sm: '140px' } // Fixed height for medium screens and up
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: localSettings.quality === quality ? 
                          qualityColors[quality].bg : alpha(theme.palette.divider, 0.1),
                        borderRadius: '8px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        '&:hover': {
                          borderColor: qualityColors[quality].bg,
                          boxShadow: localSettings.quality === quality ? 
                            `0 0 0 1px ${qualityColors[quality].bg}` : 'none'
                        }
                      }}
                      onClick={() => {
                        const newSettings = {
                          ...localSettings,
                          quality
                        };
                        setLocalSettings(newSettings);
                        onSettingsChange(newSettings);
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Chip 
                          label={quality}
                          size="small"
                          sx={{ 
                            bgcolor: qualityColors[quality].bg,
                            color: qualityColors[quality].color,
                            fontWeight: 600,
                            px: 0.5,
                            alignSelf: 'flex-start',
                            mb: 1.5
                          }}
                        />
                        
                        <Typography variant="body2" color="text.secondary">
                          {t(`quality.tooltips.${quality}`)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </RadioGroup>
          </Box>
          
          {/* Legislation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              {t('legislation.label')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('legislation.helper')}
            </Typography>
            <RadioGroup
              value={localSettings.legislation || 'WORLD'}
              onChange={handleLegislationChange}
              name="legislation"
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2 }}>
                {[
                  { value: 'WORLD', flag: 'world' },
                  { value: 'CH_EU', flag: 'ch_eu' },
                  { value: 'CH', flag: 'ch' },
                  { value: 'EU', flag: 'eu' }
                ].map((option) => (
                  <Box 
                    key={option.value} 
                    sx={{ 
                      flex: { xs: '1 0 100%', sm: '1 0 calc(50% - 8px)' },
                      display: 'flex',
                      height: { xs: 'auto', sm: '120px' } // Fixed height for medium screens and up
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: localSettings.legislation === option.value ? 
                          theme.palette.primary.main : alpha(theme.palette.divider, 0.1),
                        borderRadius: '8px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: localSettings.legislation === option.value ? 
                            `0 0 0 1px ${theme.palette.primary.main}` : 'none'
                        }
                      }}
                      onClick={() => {
                        const newSettings = {
                          ...localSettings,
                          legislation: option.value as Legislation
                        };
                        setLocalSettings(newSettings);
                        onSettingsChange(newSettings);
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          {/* Fallback for world flag since it might not exist */}
                          {option.value === 'WORLD' ? (
                            <Box 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%',
                                bgcolor: '#e3f2fd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1.5
                              }}
                            >
                              <Box 
                                component="svg" 
                                width={16} 
                                height={16} 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="#1565c0"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </Box>
                            </Box>
                          ) : (
                            option.value === 'CH_EU' ? (
                              <Box sx={{ display: 'flex' }}>
                                <Box 
                                  component="img" 
                                  src="/images/flags/ch.svg" 
                                  alt="Switzerland flag"
                                  sx={{ width: 24, height: 24, mr: 0.5 }}
                                />
                                <Box 
                                  component="img" 
                                  src="/images/flags/eu.svg" 
                                  alt="EU flag"
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                />
                              </Box>
                            ) : (
                              <Box 
                                component="img" 
                                src={`/images/flags/${option.value.toLowerCase()}.svg`} 
                                alt={`${option.value} flag`}
                                sx={{ width: 24, height: 24, mr: 1.5 }}
                              />
                            )
                          )}
                          <Typography variant="body2" fontWeight={500}>
                            {t(`legislation.options.${option.value}`)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {t(`legislation.tooltips.${option.value}`)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </RadioGroup>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Rejection Settings Accordion */}
      <Accordion 
        expanded={expanded === 'rejectionSettings'} 
        onChange={handleAccordionChange('rejectionSettings')}
        elevation={0}
        sx={{ 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
          borderRadius: '8px', 
          overflow: 'hidden',
          '&:before': { display: 'none' } // Remove the default divider
        }}
      >
        <AccordionSummary
          expandIcon={<ChevronDown />}
          sx={{ 
            borderBottom: expanded === 'rejectionSettings' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
            px: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <AlertTriangle size={20} style={{ marginRight: 12, color: theme.palette.warning.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {t('rejectionSettings')}
            </Typography>
            {expanded === 'rejectionSettings' && (
              <Tooltip title={t('resetDefaults')}>
                <IconButton 
                  size="small" 
                  onClick={resetRejectionSettings}
                  component="span"
                >
                  <RotateCcw size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Long Term Validation */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.longTermValidation || false}
                    onChange={handleLongTermValidationChange}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('longTermValidation.label')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('longTermValidation.description')}
                    </Typography>
                  </Box>
                }
              />
            </Box>
            {/* Reject Visual Differences */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.rejectVisualDifferences || false}
                    onChange={handleRejectVisualDifferencesChange}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('rejectVisualDifferences.label')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('rejectVisualDifferences.description')}
                    </Typography>
                  </Box>
                }
              />
            </Box>
            {/* Reject Undefined Changes */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.rejectUndefinedChanges || false}
                    onChange={handleRejectUndefinedChangesChange}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('rejectUndefinedChanges.label')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('rejectUndefinedChanges.description')}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
} 