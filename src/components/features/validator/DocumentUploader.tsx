'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, File, X, UploadIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import "@/styles/uploader.css";

interface DocumentUploaderProps {
  onFilesSelect: (files: File[]) => void
  selectedFiles: File[]
  isValidating: boolean
}

// Simple loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="validator-container">
      <div className="skeleton-content">
        <div className="skeleton-circle" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-description" />
        <div className="skeleton-line skeleton-description-short" />
        <div className="skeleton-badge" />
      </div>
    </div>
  )
}

export default function DocumentUploader({ onFilesSelect, selectedFiles, isValidating }: DocumentUploaderProps) {
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
    if (selectedFiles.length === 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [selectedFiles]);
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setFileError(null);
    if (acceptedFiles?.length > 0) {
      // Merge with existing files
      onFilesSelect([...selectedFiles, ...acceptedFiles]);
    } else if (fileRejections.length > 0) {
      // Show error message for rejected files
      const rejection = fileRejections[0];
      const errorMessage = rejection.errors[0]?.message || t('invalidFileType');
      setFileError(errorMessage);
    }
  }, [onFilesSelect, selectedFiles, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10, // Allow up to 10 files at once
    disabled: isValidating
  })

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    onFilesSelect(updatedFiles);
    if (updatedFiles.length === 0) {
      setFileError(null);
    }
  }

  const handleClearAllFiles = () => {
    setFileError(null);
    onFilesSelect([]);
  }

  // Conditionally render loading skeleton or the actual uploader
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="validator-container">
      {/* <div className="validator-info">
        <div className="info-icon">
          <Info size={20} />
        </div>
        <p className="info-text">
          {t('info')} {selectedFiles.length > 0 ? t('batchValidationInfo') : ''}
        </p>
      </div> */}
    
      {selectedFiles.length > 0 ? (
        <div className="files-selected-state">
          <div className="files-header">
            <h3 className="batch-title">
              {selectedFiles.length > 1 
                ? t('selectedFilesBatch', { count: selectedFiles.length }) 
                : t('selectedFile')}
            </h3>
            <button 
              type="button" 
              className="clear-all-button"
              onClick={handleClearAllFiles}
            >
              {t('clearAll')}
            </button>
          </div>
          
          <div className="files-list">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="file-item">
                <div className="file-icon-container">
                  <File size={24} className="file-icon" />
                  <div className="file-type-badge">{file.name.split('.').pop()?.toUpperCase()}</div>
                </div>
                <div className="file-info-container">
                  <h4 className="file-name" title={file.name}>{getDisplayName(file.name)}</h4>
                  <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  type="button" 
                  className="remove-file-button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isValidating}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add more files button */}
          <div className="add-more-container" {...getRootProps()}>
            <input {...getInputProps()} />
            <button type="button" className="add-more-button">
              <UploadIcon size={16} />
              {t('addMoreFiles')}
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
            <h3 className="uploader-title">{t('dragDropMultiple')}</h3>
            <p className="uploader-description">
              {t('or')} <button type="button" className="browse-button">{t('browse')}</button> {t('toUploadMultiple')}
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
  )
} 