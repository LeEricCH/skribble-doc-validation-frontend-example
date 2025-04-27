"use client";

import { Box, Typography, Card, Divider, List, ListItem, ListItemText, ListItemIcon, ListItemButton } from '@mui/material';
import { 
  LanguageOutlined, 
  // NotificationsOutlined, 
  ChevronRight
} from '@mui/icons-material';
import Link from 'next/link';

interface SettingCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

export default function SettingsOverviewPage() {
  const settingCategories: SettingCategory[] = [
    {
      title: 'Language',
      description: 'Choose your preferred language for the interface and notifications.',
      icon: <LanguageOutlined />,
      path: '/settings/language'
    },
    // {
    //   title: 'Notifications',
    //   description: 'Configure how and when you receive notifications about activity.',
    //   icon: <NotificationsOutlined />,
    //   path: '/settings/notifications'
    // }
  ];

  return (
    <Box sx={{ p: 6 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        color: '#34495e', 
        mb: 6 
      }}>
        Settings
      </Typography>

      <Box sx={{ maxWidth: 800 }}>
        <Card>
          <List disablePadding>
            {settingCategories.map((category, index) => (
              <Box key={category.title}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton 
                    component={Link} 
                    href={category.path}
                    sx={{ 
                      py: 2.5, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: 'primary.main',
                      minWidth: 40
                    }}>
                      {category.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {category.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {category.description}
                        </Typography>
                      }
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        </Card>
      </Box>
    </Box>
  );
} 