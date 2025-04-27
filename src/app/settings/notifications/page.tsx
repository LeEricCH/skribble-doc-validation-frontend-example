"use client";

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Radio, 
  RadioGroup, 
  FormControl,
  Stack,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  ArticleOutlined, 
  NotificationsOutlined, 
  BlockOutlined, 
  CheckCircle 
} from '@mui/icons-material';

export default function NotificationsSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState('all');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleEmailNotificationsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmailNotifications(event.target.value);
  };

  const handleEmailNotificationsClick = (value: string) => {
    setEmailNotifications(value);
  };

  return (
    <Box sx={{ p: 6 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        color: '#34495e', 
        mb: 6 
      }}>
        Notification Settings
      </Typography>

      <Box sx={{ maxWidth: 700 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 4 
        }}>
          Email Notifications
        </Typography>

        <Card sx={{ mb: 4 }}>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={emailNotifications} onChange={handleEmailNotificationsChange}>
              <Stack>
                {[
                  { 
                    value: 'all', 
                    label: 'All', 
                    description: 'I want to keep track of all signature activities.',
                    icon: <ArticleOutlined />
                  },
                  { 
                    value: 'important', 
                    label: 'Important', 
                    description: 'Inform me about new signature invitations and the signature progress of my documents.',
                    icon: <NotificationsOutlined />
                  },
                  { 
                    value: 'none', 
                    label: 'None', 
                    description: 'I don\'t want to be informed about any signature activity via email.',
                    icon: <BlockOutlined />
                  }
                ].map((option, index, array) => (
                  <Box 
                    key={option.value}
                    onClick={() => handleEmailNotificationsClick(option.value)}
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
                      <Box sx={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(26, 188, 156, 0.1)',
                        borderRadius: 1,
                        mr: 2,
                        '& .MuiSvgIcon-root': {
                          color: '#1abc9c',
                          fontSize: 20
                        }
                      }}>
                        {option.icon}
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </Box>
                    {emailNotifications === option.value ? (
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

        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 4 
        }}>
          Other Notification Channels
        </Typography>

        <Card>
          <Box sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>Push Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive notifications in your browser or mobile app
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
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>SMS Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive text messages for important signature events
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