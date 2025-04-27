"use client";

import type { ReactNode } from 'react';
import Sidebar from "@/components/layout/Sidebar";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme';
import { NextIntlClientProvider } from 'next-intl';

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
          <Sidebar />
          <main className="main-content">
            <div className="content-container">
              {children}
            </div>
          </main>
        </NextIntlClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
} 