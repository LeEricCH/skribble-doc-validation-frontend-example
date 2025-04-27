"use client";

import type { ReactNode } from 'react';
import SecondaryNav from '@/components/layout/SecondaryNav';
import { 
  Globe,
  Settings
  // Bell, 
} from "lucide-react";
import { useTranslations } from 'next-intl';

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const t = useTranslations('Settings');
  
  const settingsItems = [
    {
      icon: Settings,
      label: t('validation'),
      href: "/settings/validation"
    },
    {
      icon: Globe,
      label: t('language'),
      href: "/settings/language"
    }
    // {
    //   icon: Bell,
    //   label: t('notifications'),
    //   href: "/settings/notifications"
    // }
  ];

  return (
    <div className="app-container">
      <SecondaryNav 
        parentTitle={t('title')}
        parentPath="/" 
        items={settingsItems} 
      />
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
} 