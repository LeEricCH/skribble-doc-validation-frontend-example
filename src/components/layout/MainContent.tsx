"use client";

import type { ReactNode } from "react";
import Preloader from "@/components/common/Preloader";

interface MainContentProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function MainContent({ 
  children, 
  rightSidebar,
  title,
  subtitle,
  description,
  icon,
  fullWidth = false
}: MainContentProps) {
  return (
    <div className={`main-content-wrapper${fullWidth ? ' full-width' : ''}`}>
      {(title || subtitle || description) && (
        <div className="content-header">
          {title && (
            <div className="title-container">
              {icon && <div className="title-icon">{icon}</div>}
              <h1 className="content-title">{title}</h1>
            </div>
          )}
          {subtitle && <p className="content-subtitle">{subtitle}</p>}
          {description && <p className="content-description">{description}</p>}
        </div>
      )}
      <div className="content-body">
        <div className="content-main">
          <Preloader>
            {children}
          </Preloader>
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
        
        .title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .title-icon {
          display: flex;
          align-items: center;
          color: #3b82f6;
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
        
        .content-description {
          margin-top: 12px;
          margin-bottom: 0;
          color: rgba(0, 0, 0, 0.6);
          font-size: 16px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
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