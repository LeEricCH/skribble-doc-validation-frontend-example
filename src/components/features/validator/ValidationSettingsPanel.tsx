import { useState, useEffect } from 'react';
import {
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Box,
  Chip,
  Tooltip,
  Paper,
  useTheme,
  alpha,
  type SelectChangeEvent
} from '@mui/material';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ValidationOptions, SignatureQuality, Legislation, AdditionalInfo } from '@/types/validation';

interface ValidationSettingsPanelProps {
  settings: ValidationOptions | null;
  onSettingsChange: (settings: ValidationOptions) => void;
}

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

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleQualityChange = (event: SelectChangeEvent<SignatureQuality>) => {
    const newSettings = {
      ...localSettings,
      quality: event.target.value as SignatureQuality
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleLegislationChange = (event: SelectChangeEvent<Legislation>) => {
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

  const handleInfosChange = (event: SelectChangeEvent<AdditionalInfo[]>) => {
    const value = event.target.value as AdditionalInfo[];
    const newSettings = {
      ...localSettings,
      infos: value
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

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4, marginTop: 2 }}>
      {/* Validation Requirements Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShieldCheck size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('validationRequirements')}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Signature Quality */}
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  {t('quality.label')}
                </Typography>
                <Select
                  value={localSettings.quality || 'SES'}
                  onChange={handleQualityChange}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                >
                  <MenuItem value="SES">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('quality.options.SES')}</Typography>
                      <Tooltip title={t('quality.tooltips.SES')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                  <MenuItem value="AES">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('quality.options.AES')}</Typography>
                      <Tooltip title={t('quality.tooltips.AES')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                  <MenuItem value="QES">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('quality.options.QES')}</Typography>
                      <Tooltip title={t('quality.tooltips.QES')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary">
                  {t('quality.helper')}
                </Typography>
              </FormControl>
            </Box>
            {/* Legislation */}
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  {t('legislation.label')}
                </Typography>
                <Select
                  value={localSettings.legislation || 'WORLD'}
                  onChange={handleLegislationChange}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                >
                  <MenuItem value="WORLD">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('legislation.options.WORLD')}</Typography>
                      <Tooltip title={t('legislation.tooltips.WORLD')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                  <MenuItem value="CH">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('legislation.options.CH')}</Typography>
                      <Tooltip title={t('legislation.tooltips.CH')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                  <MenuItem value="EU">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('legislation.options.EU')}</Typography>
                      <Tooltip title={t('legislation.tooltips.EU')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                  <MenuItem value="CH_EU">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{t('legislation.options.CH_EU')}</Typography>
                      <Tooltip title={t('legislation.tooltips.CH_EU')}>
                        <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                      </Tooltip>
                    </Box>
                  </MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary">
                  {t('legislation.helper')}
                </Typography>
              </FormControl>
            </Box>
          </Box>
          {/* Long Term Validation */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.longTermValidation || false}
                  onChange={handleLongTermValidationChange}
                  color="primary"
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
        </Paper>
      </Box>
      {/* Additional Information Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FileCheck size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('validationSettings')}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '8px' }}>
          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              {t('infos.label')}
            </Typography>
            <Select
              multiple
              value={localSettings.infos || ['validation', 'signer']}
              onChange={handleInfosChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as AdditionalInfo[]).map((value) => (
                    <Chip
                      key={value}
                      label={t(`infos.options.${value}`)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              )}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            >
              <MenuItem value="validation">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{t('infos.options.validation')}</Typography>
                  <Tooltip title={t('infos.tooltips.validation')}>
                    <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                  </Tooltip>
                </Box>
              </MenuItem>
              <MenuItem value="format">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{t('infos.options.format')}</Typography>
                  <Tooltip title={t('infos.tooltips.format')}>
                    <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                  </Tooltip>
                </Box>
              </MenuItem>
              <MenuItem value="signer">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{t('infos.options.signer')}</Typography>
                  <Tooltip title={t('infos.tooltips.signer')}>
                    <HelpCircle size={16} style={{ marginLeft: 8, color: theme.palette.text.secondary }} />
                  </Tooltip>
                </Box>
              </MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary">
              {t('infos.helper')}
            </Typography>
          </FormControl>
        </Paper>
      </Box>
      {/* Rejection Settings Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AlertTriangle size={20} style={{ marginRight: 8, color: theme.palette.warning.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('rejectionSettings')}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        </Paper>
      </Box>
    </Box>
  );
} 