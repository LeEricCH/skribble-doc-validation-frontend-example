"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from 'next-intl';

interface SubNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  hasChevron?: boolean;
}

interface SecondaryNavProps {
  parentTitle: string;
  parentPath: string;
  items: SubNavItem[];
  bottomItems?: SubNavItem[];
}

export default function SecondaryNav({ 
  parentTitle, 
  parentPath, 
  items, 
  bottomItems = [] 
}: SecondaryNavProps) {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={t('logoTitle')}>
          <title>{t('logoTitle')}</title>
          <path d="M7.75 18L0.5 6L15 6L7.75 18Z" fill="#FF5C35"/>
          <path d="M21.25 0L14 12L28.5 12L21.25 0Z" fill="#FF5C35"/>
          <path d="M34.75 24L27.5 12L42 12L34.75 24Z" fill="#FF5C35"/>
        </svg>
        <div className="logo-text-container">
          <span className="logo-text">{t('appName')}</span>
          <span className="logo-subtitle">{parentTitle}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon size={20} className="sidebar-nav-item-icon" />
              <span className="sidebar-nav-item-text">{item.label}</span>
              {item.hasChevron && <ChevronLeft size={16} className="chevron-icon" />}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="sidebar-nav-item bottom-nav-item"
          >
            <item.icon size={20} className="sidebar-nav-item-icon" />
            <span className="sidebar-nav-item-text">{item.label}</span>
            {item.hasChevron && <ChevronLeft size={16} className="chevron-icon" />}
          </Link>
        ))}
        <Link 
          href={parentPath}
          className="sidebar-nav-item bottom-nav-item back-button"
        >
          <ChevronLeft size={20} className="sidebar-nav-item-icon" />
          <span className="sidebar-nav-item-text">{t('backToApp')}</span>
        </Link>
      </div>
    </aside>
  );
} 