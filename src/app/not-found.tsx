"use client";

import Link from "next/link";
import MainContent from "@/components/layout/MainContent";

export default function NotFound() {
  return (
    <MainContent
    >
      <div className="not-found-container">
        <div className="error-icon">404</div>
        <h2 className="error-title">Page Not Found</h2>
        <p>Sorry, we couldn&apos;t find the page you were looking for.</p>
        <Link href="/" className="back-home-button">
          Back to Home
        </Link>
      </div>

      <style jsx>{`
        .not-found-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .error-icon {
          font-size: 96px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 24px;
          line-height: 1;
          text-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .error-title {
          font-size: 28px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
          margin: 0 0 16px 0;
        }
        
        .not-found-container p {
          color: rgba(0, 0, 0, 0.6);
          font-size: 18px;
          margin-bottom: 32px;
          max-width: 400px;
        }
        
        .back-home-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #3b82f6;
          color: white;
          padding: 0 16px;
          height: 36px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .back-home-button:hover {
          background-color: #2563eb;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
        }
        
        @media (max-width: 600px) {
          .error-icon {
            font-size: 72px;
          }
          
          .error-title {
            font-size: 24px;
          }
          
          .not-found-container p {
            font-size: 16px;
          }
        }
      `}</style>
    </MainContent>
  );
} 