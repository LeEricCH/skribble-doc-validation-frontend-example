"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Paper,
  Collapse,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  KeyboardArrowRight,
  ExpandMore,
  ExpandLess,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface SubNavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface NavSection {
  title: string;
  items: SubNavItem[];
  collapsible?: boolean;
}

interface SecondarySidebarProps {
  sections: NavSection[];
  title?: string;
  width?: number | string;
  onNavigate?: () => void;
}

export default function SecondarySidebar({
  sections,
  title,
  width = 240,
  onNavigate
}: SecondarySidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('SecondarySidebar');
  const sidebarT = useTranslations('Sidebar');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>(() => {
    // Initialize each section as expanded
    const initialState: { [key: string]: boolean } = {};
    for (const section of sections) {
      // Check if any item in the section is active, then expand that section by default
      const hasActiveItem = section.items.some(item => pathname === item.path);
      initialState[section.title] = hasActiveItem;
    }
    return initialState;
  });

  // Close drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, []); // No dependencies needed since we just want to reset on navigation

  const handleSectionToggle = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isItemActive = (path: string) => pathname === path;

  const sidebarContent = (
    <Paper 
      elevation={0}
      sx={{ 
        width: isMobile ? '100%' : width, 
        height: '100%',
        borderRight: isMobile ? 'none' : '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
        borderRadius: 0,
        py: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          px: 3,
          mb: 3,
          alignItems: 'flex-start'
        }}
      >
        <Box
          component="svg"
          width={30}
          height={20}
          viewBox="0 0 36 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={sidebarT('logoTitle')}
          sx={{ 
            flexShrink: 0,
            mt: 0.5 // Align with the text
          }}
        >
          <title>{sidebarT('logoTitle')}</title>
          <path d="M7.75 18L0.5 6L15 6L7.75 18Z" fill="#e74c3c"/>
          <path d="M21.25 0L14 12L28.5 12L21.25 0Z" fill="#e74c3c"/>
          <path d="M34.75 24L27.5 12L42 12L34.75 24Z" fill="#e74c3c"/>
        </Box>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            ml: 1.5,
            lineHeight: 1
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              lineHeight: 1.1,
              mb: 0.5,
              display: 'block'
            }}
          >
            {sidebarT('appName')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              lineHeight: 1,
              display: 'block'
            }}
          >
            {sidebarT('appSubtitle')}
          </Typography>
        </Box>
      </Box>

      {title && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            px: 3,
            mb: 2
          }}
        >
          {title || t('navigation')}
        </Typography>
      )}

      {sections.map((section, index) => (
        <Box key={section.title}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          
          {section.collapsible ? (
            <>
              <ListItemButton 
                onClick={() => handleSectionToggle(section.title)}
                sx={{ px: 3 }}
              >
                <ListItemText 
                  primary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {section.title}
                    </Typography>
                  } 
                />
                {expandedSections[section.title] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedSections[section.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map(item => (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={item.path}
                        onClick={() => {
                          if (onNavigate) onNavigate();
                        }}
                        selected={isItemActive(item.path)}
                        sx={{
                          pl: 6,
                          py: 1.5,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                            pl: 'calc(1.5rem - 3px)', // Adjust padding to account for border
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        {item.icon && (
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {item.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: isItemActive(item.path) ? 500 : 400
                              }}
                            >
                              {item.label}
                            </Typography>
                          } 
                        />
                        {isItemActive(item.path) && (
                          <KeyboardArrowRight 
                            sx={{ 
                              color: 'primary.main',
                              fontSize: 18
                            }} 
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          ) : (
            <>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500, 
                  px: 3,
                  mb: 1.5
                }}
              >
                {section.title}
              </Typography>
              
              <List component="div" disablePadding>
                {section.items.map(item => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      onClick={() => {
                        if (onNavigate) onNavigate();
                      }}
                      selected={isItemActive(item.path)}
                      sx={{
                        pl: 3,
                        py: 1.5,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          borderLeft: '3px solid',
                          borderColor: 'primary.main',
                          pl: 'calc(0.75rem - 3px)', // Adjust padding to account for border
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      {item.icon && (
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: isItemActive(item.path) ? 500 : 400
                            }}
                          >
                            {item.label}
                          </Typography>
                        } 
                      />
                      {isItemActive(item.path) && (
                        <KeyboardArrowRight 
                          sx={{ 
                            color: 'primary.main',
                            fontSize: 18
                          }} 
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      ))}
    </Paper>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          color="inherit"
          aria-label={t('toggleNavigation')}
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            display: { md: 'none' },
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          anchor="right"
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: '80%',
              maxWidth: 320
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return sidebarContent;
} 