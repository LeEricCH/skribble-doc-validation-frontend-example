'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, File, Loader2, FileText, Info, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import "@/styles/uploader.css";

interface DocumentUploaderProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  isValidating: boolean
}

// Simple loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="validator-container">
      <div className="skeleton-info-box" />
      <div className="card-container skeleton-card">
        <div className="skeleton-content">
          <div className="skeleton-circle" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-description" />
          <div className="skeleton-line skeleton-description-short" />
          <div className="skeleton-badge" />
        </div>
      </div>
    </div>
  )
}

export default function DocumentUploader({ onFileSelect, selectedFile, isValidating }: DocumentUploaderProps) {
  const t = useTranslations('DocumentUploader')
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Helper to truncate long filenames
  const getDisplayName = (name: string) => {
    const maxLen = 30;
    if (name.length > maxLen) {
      const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
      return `${name.slice(0, maxLen - ext.length - 3)}...${ext}`;
    }
    return name;
  };
  
  // Simulate loading state
  useEffect(() => {
    // Only show skeleton on initial mount, not after file selection
    if (!selectedFile) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [selectedFile]);
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setFileError(null);
    if (acceptedFiles?.length > 0) {
      onFileSelect(acceptedFiles[0]);
    } else if (fileRejections.length > 0) {
      // Show error message for rejected files
      const rejection = fileRejections[0];
      const errorMessage = rejection.errors[0]?.message || t('invalidFileType');
      setFileError(errorMessage);
    }
  }, [onFileSelect, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isValidating
  })

  const handleChangeFile = () => {
    setFileError(null);
    onFileSelect(null);
  }

  // Conditionally render loading skeleton or the actual uploader
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="validator-container">
      <div className="validator-info">
        <div className="info-icon">
          <Info size={20} />
        </div>
        <p className="info-text">
          {t('info')}
        </p>
      </div>
    
      <div className="card-container">
        {isValidating ? (
          <div className="validating-state">
            <div className="validating-animation">
              <div className="spinner-container">
                <Loader2 size={72} className="spinner" />
              </div>
              <div className="document-animation">
                <FileText size={40} className="document-icon" />
              </div>
            </div>
            <div className="validating-content">
              <h3 className="validating-title">{t('validating')}</h3>
              <div className="progress-bar">
                <div className="progress-bar-inner" />
              </div>
              <p className="validating-description">
                {t('validatingDescription')}
              </p>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="file-selected-state">
            <div className="file-selected-content">
              <div className="file-icon-container">
                <File size={40} className="file-icon" />
                <div className="file-type-badge">{selectedFile.name.split('.').pop()?.toUpperCase()}</div>
              </div>
              <div className="file-info-container">
                <h3 className="file-name" title={selectedFile.name}>{getDisplayName(selectedFile.name)}</h3>
                <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="file-ready-status">
                  <CheckCircle size={16} />
                  <span>{t('readyForValidation')}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="change-file-button"
                onClick={handleChangeFile}
              >
                {t('changeFile')}
              </button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`uploader-dropzone ${isDragActive ? 'active' : ''} ${fileError ? 'error' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="upload-content">
              <div className="upload-icon-container">
                <Upload size={48} className="upload-icon" />
              </div>
              <h3 className="uploader-title">{t('dragDrop')}</h3>
              <p className="uploader-description">
                {t('or')} <button type="button" className="browse-button">{t('browse')}</button> {t('toUpload')}
              </p>
              {fileError && (
                <div className="file-error">
                  {fileError}
                </div>
              )}
              <div className="supported-formats">
                <div className="format-badge">{t('supportedFormats')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 