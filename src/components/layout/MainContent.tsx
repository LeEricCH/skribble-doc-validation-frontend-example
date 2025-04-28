"use client";

import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export default function MainContent({ 
  children, 
  rightSidebar,
  title,
  subtitle,
  fullWidth = false
}: MainContentProps) {
  return (
    <div className={`main-content-wrapper${fullWidth ? ' full-width' : ''}`}>
      {(title || subtitle) && (
        <div className="content-header">
          {title && <h1 className="content-title">{title}</h1>}
          {subtitle && <p className="content-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="content-body">
        <div className="content-main">
          {children}
        </div>
        {rightSidebar && (
          <div className="content-sidebar">
            {rightSidebar}
          </div>
        )}
      </div>

      <style jsx>{`
        .main-content-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        .main-content-wrapper.full-width {
          max-width: none;
        }
        
        .content-header {
          padding: 48px 0 32px;
          text-align: center;
        }
        
        .content-title {
          font-size: 28px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
          margin: 0;
        }
        
        .content-subtitle {
          margin-top: 8px;
          margin-bottom: 0;
          color: rgba(0, 0, 0, 0.6);
          font-size: 16px;
        }
        
        .content-body {
          display: flex;
          justify-content: center;
          padding: 0 0 32px;
          width: 100%;
        }
        
        .content-main {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .content-sidebar {
          margin-left: 32px;
          width: 350px;
        }
        
        @media (max-width: 768px) {
          .main-content-wrapper {
            padding: 0 16px;
            max-width: 100%;
          }
          
          .content-header {
            padding: 24px 0 16px;
          }
          
          .content-title {
            font-size: 24px;
          }
          
          .content-body {
            flex-direction: column;
            padding: 0 0 24px;
          }
          
          .content-main {
            width: 100%;
            min-width: 100%;
          }
          
          .content-sidebar {
            margin-left: 0;
            margin-top: 24px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 