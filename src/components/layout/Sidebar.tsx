"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  // HelpCircle,
  // Settings,
  ChevronRight,
  History,
  Upload,
  Menu,
  X,
  Globe,
  CheckCircle
} from "lucide-react";
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import Image from 'next/image';

// Language mapping
interface LanguageData {
  iso: string;
  flag: string;
}

const LANGUAGE_MAP: Record<string, LanguageData> = {
  'deutsch': { iso: 'de', flag: 'de' },
  'english': { iso: 'en', flag: 'gb' },
  'francais': { iso: 'fr', flag: 'fr' }
};

// Dropdown Menu Item component
interface DropdownMenuItemProps {
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
  toggleOpen: () => void;
  children: React.ReactNode;
}

const DropdownMenuItem = ({ icon: Icon, label, isOpen, toggleOpen, children }: DropdownMenuItemProps) => {
  return (
    <div className="dropdown-menu-container">
      <button 
        type="button"
        className="sidebar-nav-item bottom-nav-item dropdown-trigger"
        onClick={toggleOpen}
      >
        <Icon size={20} className="sidebar-nav-item-icon" />
        <span className="sidebar-nav-item-text">{label}</span>
        <ChevronRight 
          size={16} 
          className={`chevron-icon ${isOpen ? 'rotate' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="dropdown-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // const [helpOpen, setHelpOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('english');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Close mobile sidebar when route changes
    setMobileOpen(false);
    // Close dropdowns when route changes
    // setHelpOpen(false);
    setLanguageOpen(false);
  }, []);

  useEffect(() => {
    // Load the current language preference on component mount
    const savedLocale = Cookies.get('locale');
    if (savedLocale) {
      // Convert ISO code back to internal language code
      const internalCode = Object.entries(LANGUAGE_MAP).find(
        ([, data]) => data.iso === savedLocale
      )?.[0];
      
      if (internalCode) {
        setCurrentLanguage(internalCode);
      }
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // const toggleHelpDropdown = () => {
  //   setHelpOpen(!helpOpen);
  //   if (!helpOpen) setLanguageOpen(false);
  // };

  const toggleLanguageDropdown = () => {
    setLanguageOpen(!languageOpen);
    // if (!languageOpen) setHelpOpen(false);
  };

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language);
    const languageData = LANGUAGE_MAP[language as keyof typeof LANGUAGE_MAP];
    if (languageData) {
      Cookies.set('locale', languageData.iso, { expires: 365 });
      window.location.reload();
    }
  };

  const navItems = [
    { 
      icon: Upload, 
      label: t('validate'), 
      href: "/",
      onClick: () => {
        if (pathname === '/') {
          window.location.href = '/';
        }
      }
    },
    { icon: History, label: t('history'), href: "/history" },
  ];
  
  // const bottomNavItems = [
  //   { icon: Settings, label: t('settings'), href: "/settings/validation" },
  // ];

  return (
    <>
      {isMobile && (
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          onKeyUp={toggleMobileMenu}
          type="button"
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}
      
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={t('logoTitle')}>
            <title>{t('logoTitle')}</title>
            <path d="M7.75 18L0.5 6L15 6L7.75 18Z" fill="#e74c3c"/>
            <path d="M21.25 0L14 12L28.5 12L21.25 0Z" fill="#e74c3c"/>
            <path d="M34.75 24L27.5 12L42 12L34.75 24Z" fill="#e74c3c"/>
          </svg>
          <div className="logo-text-container">
            <span className="logo-text">{t('appName')}</span>
            <span className="logo-subtitle">{t('appSubtitle')}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={item.onClick}
              >
                <item.icon size={20} className="sidebar-nav-item-icon" />
                <span className="sidebar-nav-item-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <DropdownMenuItem 
            icon={Globe} 
            label={t('language')} 
            isOpen={languageOpen} 
            toggleOpen={toggleLanguageDropdown}
          >
            {Object.entries(LANGUAGE_MAP).map(([lang, data]) => (
              <button
                key={lang}
                className="dropdown-item language-item"
                onClick={() => changeLanguage(lang)}
                type="button"
              >
                <div className="language-item-content">
                  <Image 
                    src={`/images/flags/${data.flag}.svg`} 
                    width={20} 
                    height={20} 
                    alt={`${lang} flag`}
                    className="language-flag"
                  />
                  <span>{lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
                </div>
                {currentLanguage === lang && <CheckCircle size={16} className="check-icon" />}
              </button>
            ))}
          </DropdownMenuItem>
          
          {/* <DropdownMenuItem 
            icon={HelpCircle} 
            label={t('help')} 
            isOpen={helpOpen} 
            toggleOpen={toggleHelpDropdown}
          >
            <Link href="/help/faq" className="dropdown-item">
              {t('faq')}
            </Link>
          </DropdownMenuItem>
           */}
          {/* {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item bottom-nav-item"
            >
              <item.icon size={20} className="sidebar-nav-item-icon" />
              <span className="sidebar-nav-item-text">{item.label}</span>
            </Link>
          ))} */}
        </div>
      </aside>

      {mobileOpen && (
        <button 
          className="sidebar-backdrop" 
          onClick={toggleMobileMenu}
          type="button"
          aria-label={t('closeMenu')}
        />
      )}

      <style jsx>{`
        .mobile-menu-toggle {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 1100;
          background: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
        }

        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          appearance: none;
        }

        @media (max-width: 767px) {
          .sidebar {
            position: fixed;
            left: -280px;
            transition: transform 0.3s ease;
            z-index: 1050;
          }

          .sidebar.mobile-open {
            transform: translateX(280px);
          }
        }
      `}</style>

      <style jsx global>{`
        body {
          padding: 0;
          margin: 0;
          display: flex;
        }
        
        main {
          flex: 1;
          width: 100%;
          margin-left: 240px; /* Width of the sidebar */
        }
        
        .sidebar {
          width: 240px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background-color: #1a2238;
          color: white;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        
        @media (max-width: 767px) {
          main {
            margin-left: 0;
            width: 100%;
          }
        }
        
        .sidebar-logo {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding: 0 1.5rem;
        }
        
        .logo-text-container {
          display: flex;
          flex-direction: column;
          margin-left: 0.75rem;
        }
        
        .logo-text {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.2;
          color: white;
        }
        
        .logo-subtitle {
          font-size: 0.875rem;
          color: #ffffffcc;
          font-weight: 400;
        }
        
        .dropdown-menu-container {
          position: relative;
          width: 100%;
        }
        
        .dropdown-trigger {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
        }
        
        .dropdown-content {
          background-color: #253151;
          width: 100%;
          border-radius: 0;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #ffffffcc;
          padding: 0.75rem 1.5rem 0.75rem 3rem;
          text-decoration: none;
          font-size: 0.875rem;
          transition: background-color 0.2s;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .dropdown-item:hover {
          background-color: #1e293d;
          color: white;
        }
        
        .chevron-icon {
          margin-left: auto;
          transition: transform 0.3s ease;
        }
        
        .chevron-icon.rotate {
          transform: rotate(90deg);
        }
        
        .language-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .language-item-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .language-flag {
          border-radius: 2px;
        }
        
        .check-icon {
          color: #e74c3c;
        }
      `}</style>
    </>
  );
} 