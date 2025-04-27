"use client";

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Radio, 
  RadioGroup, 
  FormControl,
  Stack
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';

// Map internal language codes to ISO codes for cookies/API
const LANGUAGE_MAP = {
  'deutsch': 'de',
  'english': 'en',
  'francais': 'fr'
};

export default function LanguageSettingsPage() {
  const t = useTranslations('LanguageSettings');
  const [language, setLanguage] = useState('english');

  // Load the current language preference on component mount
  useEffect(() => {
    const savedLocale = Cookies.get('locale');
    if (savedLocale) {
      // Convert ISO code back to internal language code
      const internalCode = Object.entries(LANGUAGE_MAP).find(
        ([, iso]) => iso === savedLocale
      )?.[0];
      
      if (internalCode) {
        setLanguage(internalCode);
      }
    }
  }, []);

  const handleLanguageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLanguage(event.target.value);
    saveLanguagePreference(event.target.value);
  };

  const handleLanguageClick = (value: string) => {
    setLanguage(value);
    saveLanguagePreference(value);
  };

  const saveLanguagePreference = (languageValue: string) => {
    // Save to cookies
    const isoCode = LANGUAGE_MAP[languageValue as keyof typeof LANGUAGE_MAP];
    if (isoCode) {
      Cookies.set('locale', isoCode, { expires: 365 });
      
      // Reload the page to apply the new language
      window.location.reload();
    }
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

      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('description')}
        </Typography>

        <Card>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={language} onChange={handleLanguageChange}>
              <Stack>
                {[
                  { value: 'deutsch', flag: 'de' },
                  { value: 'english', flag: 'gb' },
                  { value: 'francais', flag: 'fr' }
                ].map((option, index, array) => (
                  <Box 
                    key={option.value}
                    onClick={() => handleLanguageClick(option.value)}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      ...(index < array.length - 1 && {
                        borderBottom: '1px solid',
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                      })
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="img" 
                        src={`/images/flags/${option.flag}.svg`} 
                        alt={`${t(`languages.${option.value}`)} flag`}
                        sx={{ width: 24, height: 24, mr: 2 }}
                      />
                      <Typography variant="body1">{t(`languages.${option.value}`)}</Typography>
                    </Box>
                    {language === option.value ? (
                      <CheckCircle sx={{ color: 'primary.main', fontSize: 24 }} />
                    ) : (
                      <Radio 
                        value={option.value}
                        sx={{ opacity: 0, position: 'absolute' }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>
        </Card>
      </Box>
    </Box>
  );
}