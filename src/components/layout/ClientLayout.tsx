"use client";

import type { ReactNode } from 'react';
import Sidebar from "@/components/layout/Sidebar";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/contexts/AuthContext';

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, Record<string, string>>;
}

export default function ClientLayout({ children, locale, messages }: ClientLayoutProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <NextIntlClientProvider 
          locale={locale} 
          messages={messages}
          timeZone="Europe/Zurich"
          // You can also use Intl.DateTimeFormat().resolvedOptions().timeZone to get browser timezone
        >
          <AuthProvider>
            <Sidebar />
            <main className="main-content">
              <div className="content-container">
                {children}
              </div>
            </main>
          </AuthProvider>
          
          <style jsx global>{`
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
            }
            
            .main-content {
              margin-left: 240px;
              min-height: 100vh;
              background-color: #ffffff;
            }
            
            .content-container {
              padding: 20px;
            }
            
            @media (max-width: 767px) {
              .main-content {
                margin-left: 0;
              }
            }
          `}</style>
        </NextIntlClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
} 