'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User, ChevronRight, Loader } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localAuthState, setLocalAuthState] = useState(isAuthenticated);
  const t = useTranslations('Sidebar');
  
  // Update local auth state when the actual auth state changes
  useEffect(() => {
    if (!isLoggingOut) {
      setLocalAuthState(isAuthenticated);
    }
  }, [isAuthenticated, isLoggingOut]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setIsLoggingOut(true);
    
    try {
      // Call the actual logout function
      await logout();
      
      // Wait a moment before updating the UI
      setTimeout(() => {
        setLocalAuthState(false);
        setIsLoggingOut(false);
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Show loading state while logging out
  if (isLoggingOut) {
    return (
      <div className="sidebar-nav-item bottom-nav-item">
        <Loader size={20} className="sidebar-nav-item-icon loading-icon" />
        <span className="sidebar-nav-item-text">{t('loggingOut') || 'Logging out...'}</span>
        <style jsx>{`
          .loading-icon {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, show login button that matches sidebar style
  if (!localAuthState) {
    return (
      <button
        type="button"
        className="sidebar-nav-item bottom-nav-item"
        onClick={login}
      >
        <LogIn size={20} className="sidebar-nav-item-icon" />
        <span className="sidebar-nav-item-text">{t('loginWithSkribble')}</span>
      </button>
    );
  }

  // If authenticated, show user dropdown that matches language dropdown
  return (
    <div className="dropdown-menu-container">
      <button 
        type="button"
        className="sidebar-nav-item bottom-nav-item dropdown-trigger"
        onClick={toggleDropdown}
      >
        <User size={20} className="sidebar-nav-item-icon" />
        <span className="sidebar-nav-item-text">
          {user?.name || user?.username || user?.email}
        </span>
        <ChevronRight 
          size={16} 
          className={`chevron-icon ${dropdownOpen ? 'rotate' : ''}`} 
        />
      </button>
      
      {dropdownOpen && (
        <div className="dropdown-content">
          <button
            type="button"
            className="dropdown-item"
            onClick={handleLogout}
          >
            <div className="dropdown-item-content">
              <LogOut size={18} className="dropdown-item-icon" />
              <span>{t('logout')}</span>
            </div>
          </button>
        </div>
      )}
      
      <style jsx>{`
        .dropdown-item-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .dropdown-item-icon {
          color: currentColor;
        }
        
        .dropdown-trigger {
          width: 100%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default UserMenu; 